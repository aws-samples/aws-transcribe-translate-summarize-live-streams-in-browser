import { fetchAuthSession } from 'aws-amplify/auth';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

const apiGatewayId = config.module.api_gateway_id
const region = config.module.aws_project_region
const apiGatewayBaseUrl = `https://${apiGatewayId}.execute-api.${region}.amazonaws.com/prod`

const type_of_audio = {
    MONOLOGUE: 'single_speech',
    DIALOGUE: 'dialogue'
}

let idToken = null
let audioId = null

export const initIdToken = async () => { 
    const { tokens } = await fetchAuthSession();
    const { idToken: idTokenObj } = tokens;
    idToken = idTokenObj.toString()

    // init audio_id
    audioId = uuidv4();
}

export const sendText = async ({ transcript, lang, translationLang, translation, numSpeakers }) => {

    try {
        const audioType = numSpeakers > 1 ? type_of_audio.DIALOGUE : type_of_audio.MONOLOGUE

        console.log("About to send transcription to API gateway - START", { audioId })

        const res = await axios.post(`${apiGatewayBaseUrl}/summarization`,
        {
            audio_id: audioId,
            original_language: lang,
            translation_language: translationLang,
            original_text: transcript,
            translated_text: translation,
            type_of_audio: audioType
        },
        { 
            headers: { 
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        } )

        console.log("Response status code:", res.status)

        console.log("response")
        console.log(res.data)

        return res.data?.summary_language
    
    } catch(err){
        console.log("Transcription to API gateway - FAILURE")

        console.log(err)
    }

}

export const getSummary = async ({ summaryLang, translationLang }) => {

    try {

        console.log("About to get summary from API gateway - START", { audioId })

        const res = await axios.get(`${apiGatewayBaseUrl}/summary`,
        {
            params: {
                audio_id: audioId,
                summary_language: summaryLang,
                translation_language: translationLang
            },
            headers: { 
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        })

        console.log("Response status code:", res.status)

        console.log("response")
        console.log(res.data)

        return res.data?.summary
    
    } catch(err){
        console.log("Summary from API gateway - FAILURE")

        console.log(err)
    }
}

export const clearBucketS3 = async () => {
    try {

        console.log("About to DELETE all conversations from API gateway - START")
        if(!idToken){
            await initIdToken()
        }

        const res = await axios.delete(`${apiGatewayBaseUrl}/summary`,
        {
            headers: { 
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        })

        console.log("Response status code:", res.status)

        console.log("response")
        console.log(res.data)
    
    } catch(err){
        console.log("Delete from API gateway - FAILURE")

        console.log(err)
    }
}


