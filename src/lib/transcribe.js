import { fetchAuthSession } from 'aws-amplify/auth';
import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming"; // ES Modules import
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers"; // ES6 import
import mic from "microphone-stream";
import awsmobile from '../aws-exports';
import { Buffer } from 'buffer';
import process from 'process';

// @ts-ignore
window.Buffer = Buffer;
if (!('process' in window)) {
    // @ts-ignore
    window.process = process
}

let micStream = undefined;
let config = undefined;

const languagesTranscribe = ["en-US","en-GB","es-US","fr-CA","fr-FR","en-AU","it-IT","de-DE","pt-BR","ja-JP","ko-KR","zh-CN","th-TH","es-ES","ar-SA","pt-PT","ca-ES","ar-AE","hi-IN","zh-HK","nl-NL","no-NO","sv-SE","pl-PL","fi-FI","zh-TW","en-IN","en-IE","en-NZ","en-AB","en-ZA","en-WL","de-CH","af-ZA","eu-ES","hr-HR","cs-CZ","da-DK","fa-IR","gl-ES","el-GR","he-IL","id-ID","lv-LV","ms-MY","ro-RO","ru-RU","sr-RS","sk-SK","so-SO","tl-PH","uk-UA","vi-VN","zu-ZA"]
// identifyLanguagesOptions is languagesTranscribe without dialects of the same language:
const identifyLanguagesOptions = ["en-US", "es-US", "fr-FR", "it-IT", "de-DE", "pt-BR", "ja-JP", "ko-KR", "zh-CN", "hi-IN", "th-TH"]

export const automaticLanguage = "auto"
export const transcribeLanguageOptions = [automaticLanguage, ...languagesTranscribe].map(lang => ({ label: lang, value: lang }))

export const createConfig = async () => {
    const { tokens } = await fetchAuthSession();
    const { idToken } = tokens;
    
    config = {
        region: awsmobile.aws_cognito_region,
        credentials: fromCognitoIdentityPool({
            clientConfig: {region: awsmobile.aws_cognito_region},
            identityPoolId: awsmobile.aws_cognito_identity_pool_id,
            logins: {
                [`cognito-idp.${awsmobile?.aws_cognito_region}.amazonaws.com/${awsmobile?.aws_user_pools_id}`]: idToken.toString()
            }
        })
    };
    return config
}

const encodePCMChunk = (chunk) => {
    const input = mic.toRaw(chunk);
    let offset = 0;
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return Buffer.from(buffer);
  };

export const startStreamingTranscription = async ({mediaStream, callback, options}) => {
    // DOC: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/transcribe-streaming/command/StartStreamTranscriptionCommand/

    const micStream = new mic(); //let's get the mic input from the browser, via the microphone-stream module
    let inputSampleRate = 0;
    const {language, identifyLanguage} = options

    micStream.on("format", function (data) {
        inputSampleRate = data.sampleRate;
    });

    micStream.setStream(mediaStream);
    
    const transcribeClient = new TranscribeStreamingClient(config);

    const getAudioStream = async function* () {
        for await (const chunk of micStream) {
            if (chunk.length <= 44100) {
                // chuck length 4096
                yield {
                    AudioEvent: {
                        AudioChunk: encodePCMChunk(chunk),
                    },
                };
            }
        }
    };

    const startStreaming = async (callback) => {
        const command = new StartStreamTranscriptionCommand({
            // if identifyLanguage is true then use it, otherwise use language as LanguageCode
            ...(identifyLanguage === true ? 
                {
                    IdentifyLanguage: identifyLanguage,
                    LanguageOptions: identifyLanguagesOptions.join()
                } : 
                {LanguageCode: language}),
            MediaEncoding: "pcm",
            MediaSampleRateHertz: 44100,
            AudioStream: getAudioStream(),
            ShowSpeakerLabel: true
        });
        const data = await transcribeClient.send(command);
        for await (const event of data.TranscriptResultStream) {
            const results = event.TranscriptEvent.Transcript.Results;
            if (results.length) {
                const newTranscript = results[0].Alternatives[0].Transcript;
                const final = !results[0]?.IsPartial;
                const speaker = results[0].Alternatives[0]?.Items[0]?.Speaker;
                const identifiedLanguage = identifyLanguage === true && final ? results[0].LanguageCode : undefined;
                callback(newTranscript + " ", final, speaker, identifiedLanguage);
          }
        }
    };

    await startStreaming(callback);
}


export const stopStreamingTranscription = () => {
    if (micStream) {
        micStream.stop();
        micStream.destroy();
        micStream = undefined;
    }
  };