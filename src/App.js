/* eslint-disable no-undef */

import { useState } from 'react';
import { Amplify } from 'aws-amplify';
import { LiveAudioVisualizer } from 'react-audio-visualize';

import { withAuthenticator, Text } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { SpaceBetween, Container, Header, Button, Box, Select, TextContent, Tabs, Grid, Modal, Alert, Toggle, Icon } from "@cloudscape-design/components";

import awsExports from './aws-exports';
import config from './config';
import { automaticLanguage, createConfig, startStreamingTranscription, stopStreamingTranscription, transcribeLanguageOptions } from './lib/transcribe';
import { createTranslateClient, translateLanguageOptions, translateText } from './lib/translate';
import { clearBucketS3, getSummary, initIdToken, sendText } from './lib/summarize';

Amplify.configure(awsExports);

let BUCKET_NAME = config.module.BucketS3Name
let recorder;
let data = [];
let error = undefined;

// initialize global variables needed for summarization
let textToSummarize = ""
let translationToSummarize = ""
let langToSummarize = ""
let translationLangToSummarize = ""
let numSpeakers = 0
let summaryLanguage = ""
let recordingInterval = false
let updatedSummary = false
  
async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  console.log(tab)
  return tab;
}

function summarizeTextAtInterval({setSummaryError}) {
  // send conversation to Amazon Bedrock through API GW to generate a summary

  setSummaryError(null)

  if(recordingInterval && textToSummarize != undefined){
    sendText({transcript: textToSummarize, lang: langToSummarize, translationLang: translationLangToSummarize, translation: translationToSummarize, numSpeakers})
      .then(value => {
        if(value?.error){
          setSummaryError(value.message)
        }else{
          summaryLanguage = value
          updatedSummary = true
        }
      })
      .catch(error => console.log(error))
    textToSummarize = ""
    translationToSummarize = ""
  }
}

async function retrieveSummary({setSummary, setActiveSummaryButton, setSummaryError, summaryError}) {
  setActiveSummaryButton(false)
  let retry = 0
  updatedSummary = false
  while(!updatedSummary && retry < 10){
    // Update the summary before retrieving it
    summarizeTextAtInterval({setSummaryError})
    // wait 5 secs and retry
    await new Promise(r => setTimeout(r, 5000));
    retry+= 1
  }

  getSummary({ summaryLang: summaryLanguage, translationLang: translationLangToSummarize })
    .then(value => {
      if(value?.error){
        setSummary("")
        if(!summaryError) { setSummaryError(value.message) }
      }else{
        setSummary(value)
      }
      setActiveSummaryButton(true)
    })
    .catch(error => console.log(error))
}

async function startRecording({streamId, transcription, setTranscription, setCurrentTranscription, translation, setTranslation, options, setTranslationError, setSummaryError}) {
  console.log("start recording")
  if (recorder?.state === 'recording') {
    throw new Error('Called startRecording while recording is in progress.');
  }

  const media = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
    }
  });

  const meeting = options.mic // The audio can be either a video in the browser tab or a meeting where we want to record also the audio from microphone
  const mediaMic = meeting ? await navigator.mediaDevices.getUserMedia({
    audio: true
  }) : undefined;

  // Continue to play the captured audio to the user.
  const output = new AudioContext();
  const source = output.createMediaStreamSource(media);
  source.connect(output.destination);

  // Join the two audio stream sources
  const audioContext = new AudioContext();

  const audioIn_01 = audioContext.createMediaStreamSource(media);
  const audioIn_02 = meeting ? audioContext.createMediaStreamSource(mediaMic) : undefined;

  const dest = audioContext.createMediaStreamDestination();

  audioIn_01.connect(dest);
  if(meeting) audioIn_02.connect(dest);

  const finalStream = dest.stream

  // Start recording.
  recorder = new MediaRecorder(finalStream, { mimeType: 'video/webm' });
  recorder.ondataavailable = (event) => data.push(event.data);
  recorder.onstop = () => {
    // const blob = new Blob(data, { type: 'video/webm' });
    // window.open(URL.createObjectURL(blob), '_blank');

    media.getTracks().forEach((t) => t.stop());
    if(meeting) mediaMic.getTracks().forEach((t) => t.stop());
  };

  // timeslice: number of milliseconds to record into each Blob
  recorder.start();

  // options if set
  const { transcriptionLang, translationLang, identifyLanguage } = options

  // initialize clients and authentication
  const clientConfig = await createConfig()
  createTranslateClient(clientConfig)
  await initIdToken()

  // initialize variables needed for transcription and translation whenever a new conversation starts
  setTranscription([])
  setTranslation([])
  setTranslationError(null)
  transcription = [] // state variable used to transcribe entire meeting/video - the "setTranscription" method whould be enough
  translation = [] // state variable used to translate entire meeting/video - the "setTranslation" method whould be enough
  let previousSpeaker = undefined

  // clean variables needed for summarization with new conversation
  textToSummarize = ""
  translationToSummarize = ""
  langToSummarize = transcriptionLang
  translationLangToSummarize = translationLang
  numSpeakers = 0
  summaryLanguage = undefined

  // every 3 mins summarize text: only if recording!
  setInterval((setSummaryError) => summarizeTextAtInterval({setSummaryError}), 360000);

  chrome.action.setIcon({ path: 'icons/recording.png' });
  chrome.action.setBadgeText({ text: 'ON' });

  await startStreamingTranscription({mediaStream: finalStream, callback: (transcript, final, speaker, identifiedLanguage) => {
      if(final){
        // when transcription is final, add the "speaker" label
        // transcription_array is the array of transcription sentences
        const transcription_array = transcription

        let text = ""
        let changeTranslationSpeaker = false
        if(!previousSpeaker || speaker !== previousSpeaker){
          // when a sentence belongs to a new speaker, add the "speaker" label
          text = `${speaker ? `Speaker ${speaker}` : 'Unknown speaker' }: ${transcript}`
          previousSpeaker = speaker
          numSpeakers += 1
          changeTranslationSpeaker = true
        }else{
          // when a sentence belongs to the same speaker, append to the same sentence
          text = transcription_array?.pop() ?? ""
          text += transcript
        }
        // push the new final transcription with the speaker label to the array and store it in the transcription state variable
        transcription_array.push(text)
        setTranscription(transcription_array)
        setCurrentTranscription("")

        // update variables to summarize conversation with Amazon Bedrock (transcription), only when transcription is final
        textToSummarize += `${text}\n`
        if(identifiedLanguage) { langToSummarize = identifiedLanguage }
        
        // translation_array is the array of translation sentences
        const translation_array = translation
        // translate the final transcription to the translation language
        translateText(transcript, identifiedLanguage ?? transcriptionLang, translationLang) 
          .then(transcriptTranslation => {

            let translatedText = ""
            if(changeTranslationSpeaker){
              translatedText = `${speaker ? `Speaker ${speaker}` : 'Unknown speaker' }: ${transcriptTranslation}`
            }else{
              translatedText = translation_array?.pop() ?? ""
              translatedText += transcriptTranslation
            }

            translation_array.push(translatedText)
            setTranslation(translation_array)

            // update variables to summarize conversation with Amazon Bedrock (translation)
            translationToSummarize += `${translatedText}\n`

          })
          .catch(err => {
            console.log(err)
            // Check if the error message matches the specific UnsupportedLanguagePairException
            if (err && err.toString().includes("UnsupportedLanguagePairException: Unsupported language pair")) {
              // Handle the specific error
              const errorMessage = "Unsupported language pair detected. Unable to translate."
              console.error(errorMessage);
              // You can set a state variable to show an error message to the user
              setTranslation([""])
              setTranslationError(`Error: ${errorMessage}`)
            } else {
              // Handle other types of errors
              console.error("An error occurred during translation:", err);
            }
          })
        
      }else{
        // while the transcription is not final, set the current transcription in the currentTranscription variable, with "speaker" label
        setCurrentTranscription(speaker ? `Speaker ${speaker}: ${transcript}` : transcript)
      }
    },
    options: {
      language: transcriptionLang,
      identifyLanguage
    }
  })

  // Record the current state in the URL. This provides a very low-bandwidth
  // way of communicating with the service worker (the service worker can check
  // the URL of the document and see the current recording state). We can't
  // store that directly in the service worker as it may be terminated while
  // recording is in progress. We could write it to storage but that slightly
  // increases the risk of things getting out of sync.
  window.location.hash = 'recording';
}

async function stopRecording({setRecordingOn, setSummaryError}) {
  recorder.stop();

  // send last chunk of conversation to summarize
  summarizeTextAtInterval({setSummaryError})

  // close mic when finish transcription
  stopStreamingTranscription()

  // Stopping the tracks makes sure the recording icon in the tab is removed.
  recorder.stream.getTracks().forEach((t) => t.stop());

  // Clear state ready for next recording
  recorder = undefined;
  data = [];

  // Update current state in URL
  window.location.hash = '';

  // Note: In a real extension, you would want to write the recording to a more
  // permanent location (e.g IndexedDB) and then close the offscreen document,
  // to avoid keeping a document around unnecessarily. Here we avoid that to
  // make sure the browser keeps the Object URL we create (see above) and to
  // keep the sample fairly simple to follow.

  setRecordingOn(false)
  recordingInterval = false
  chrome.action.setIcon({ path: 'icons/not-recording.png' });
  chrome.action.setBadgeText({ text: 'OFF' });
}


async function recording({setRecordingOn, transcription, setTranscription, setCurrentTranscription, translation, setTranslation, options, setTranslationError, setSummaryError}) {
  setRecordingOn(true)
  recordingInterval = true

  const tab = await getCurrentTab()
  const tabId = tab.id

  try{
    // TODO: the following works only if you activate the extension on the tab first!!

    // Get a MediaStream for the active tab.
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId,
    });

    error = undefined
    await startRecording({streamId, transcription, setTranscription, setCurrentTranscription, translation, setTranslation, options, setTranslationError, setSummaryError})

  }catch(e){
    console.log("error recording")
    console.log(e)
    error = e.toString()

    // If recording throws some error: stop recording
    chrome.action.setIcon({ path: 'icons/not-recording.png' });
    chrome.action.setBadgeText({ text: 'OFF' });

    setRecordingOn(false)
    recordingInterval = false
    return
  }
}

function App() {

  const [recordingOn, setRecordingOn] = useState(false);
  const [transcription, setTranscription] = useState([""])
  const [currentTranscription, setCurrentTranscription] = useState("")
  const [translation, setTranslation] = useState([""])
  const [summary, setSummary] = useState(undefined)
  const [activeSummaryButton, setActiveSummaryButton] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [translationError, setTranslationError] = useState(null);
  const [summaryError, setSummaryError] = useState(null);
  
  const [options, setOptions] = useState({transcriptionLang: "en-US", translationLang: "it", identifyLanguage: false, mic: false}) // default

  return (
    <Container 
      fitHeight 
      header={
        <Header variant="h2">Transcribe, translate and summarize live streams (powered by AWS)</Header>
      }>
      <SpaceBetween size="m" direction='vertical'>
        <Container header={
          <Header
            variant="h3"
            actions={
              <Box>
                <SpaceBetween size="m" direction='horizontal'>
                <Toggle
                  disabled={recordingOn}
                  onChange={({ detail }) =>
                    setOptions({...options, mic: detail.checked})
                  }
                  checked={options.mic}
                >
                  {options.mic ? <Icon name="microphone" /> : <Icon name="microphone-off" />}
                </Toggle>
                { !recordingOn ? 
                  <Button onClick={() => {
                    setTranscription([])
                    setSummary(undefined)
                    recording({setRecordingOn, transcription, setTranscription, setCurrentTranscription, translation, setTranslation, options, setTranslationError, setSummaryError})}
                  }>Start recording</Button> : 
                  <Button onClick={() => stopRecording({setRecordingOn, setSummaryError})}>Stop recording</Button>
                }
                </SpaceBetween>
              </Box>
            }>Settings</Header>
          }>
          <SpaceBetween size="m" direction='vertical'>
          <Grid
            gridDefinition={[{ colspan: 5 }, { colspan: 5 }]}
          >
            <div>Transcription language:</div>
            <div>Translation language:</div>
          </Grid>
          <Grid
            gridDefinition={[{ colspan: 5 }, { colspan: 5 }]}
          >
            <Select
              selectedOption={{ label: options.transcriptionLang, value: options.transcriptionLang }}
              onChange={({ detail }) => setOptions({...options, transcriptionLang: detail.selectedOption.value, identifyLanguage: detail.selectedOption.value === automaticLanguage})}
              disabled={recordingOn}
              options={transcribeLanguageOptions}
            />
              
            <Select
              selectedOption={{ label: options.translationLang, value: options.translationLang }}
              onChange={({ detail }) => setOptions({...options, translationLang: detail.selectedOption.value})}
              disabled={recordingOn}
              options={translateLanguageOptions}
            />
          </Grid>
          <Box>
              {!error && recorder ? (
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <LiveAudioVisualizer
                    mediaRecorder={recorder}
                    width={100}
                    height={30}
                  />
                </div>
              ) : ( error ?
                <TextContent>{`${error}.\nUse troubleshooting tips in README.md to solve the issue.`}</TextContent> :
                <div style={{height: '30px'}}></div>
              )}
          </Box>
          </SpaceBetween>
        </Container>
        <Container>
        <Tabs
          tabs={[
            {
              label: "Transcription",
              id: "transcription",
              content: 
                <>
                {transcription.map(text => <TextContent >{text}</TextContent> )}
                
                <Text style={{fontStyle: 'italic'}} >{currentTranscription} </Text>
                </>
            },
            {
              label: "Translation",
              id: "translation",
              content: 
              <>
                {translationError ? 
                  <Box color="text-status-error" textAlign="center" fontSize="heading-m">{translationError}</Box>
                  : translation.map(text => <TextContent >{text}</TextContent> )}
              </>
            },
            {
              label: "Summary",
              id: "summary",
              content: 
              <SpaceBetween size="m" direction='vertical'>
                <Button disabled={!transcription?.[0] || transcription?.[0] === "" || !activeSummaryButton} onClick={() => retrieveSummary({setSummary, setActiveSummaryButton, setSummaryError, summaryError})}>
                  <SpaceBetween size="s" direction='horizontal'>
                    {!summary ? "Get summary" : "Update summary"}
                    <Icon name="gen-ai" />
                  </SpaceBetween>
                </Button>
                { summaryError ? 
                  <Box color="text-status-error" textAlign="center" fontSize="heading-m">{summaryError}</Box>
                  : <TextContent>{summary}</TextContent> 
                }
              </SpaceBetween>
            },
            {
              label: "Clean up",
              id: "cleanup",
              content: 
              <>
                <Button disabled={recordingOn}
                  onClick={() => setShowDeleteModal(true)}>
                  <SpaceBetween size="s" direction='horizontal'>
                    Clear all conversations
                    <Icon name="remove" />
                  </SpaceBetween>
                </Button>  
                <DeleteModal
                  visible={showDeleteModal}
                  onDiscard={() => setShowDeleteModal(false)}
                  onDelete={clearBucketS3}
                />
              </>
            }
          ]}
        />
        </Container>
      </SpaceBetween>
    </Container>
  );
}

function DeleteModal({ visible, onDiscard, onDelete }) {
  return (
    <Modal
      visible={visible}
      onDismiss={onDiscard}
      header={'Delete data on AWS Cloud'}
      closeAriaLabel="Close dialog"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDiscard}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => {
                onDelete()
                onDiscard()
              }} data-testid="submit">
              Delete
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <Box variant="span"> 
              Permanently delete resources on the AWS cloud: Objects in Bucket S3
              <Box variant="span" fontWeight="bold">
                {` ${BUCKET_NAME}`}
              </Box>
              ? You can’t undo this action.
        </Box>

        <Alert statusIconAriaLabel="Info">
          Proceeding with this action will clear all conversations in the S3 Bucket 
          {` ${BUCKET_NAME}`} and can
          affect related resources.
          
        </Alert>
      </SpaceBetween>
      
    </Modal>
  );
}

export default withAuthenticator(App);
