import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate"; // ES Modules import

let translateClient = null

export const translateLanguageOptions = ["af", "sq", "am", "ar", "hy", "az", "bn", "bs", "bg", "ca", "zh", "zh-TW", "hr", "cs", "da", "fa-AF", "nl", "en", "et", "fa", 
    "tl", "fi", "fr", "fr-CA", "ka", "de", "el", "gu", "ht", "ha", "he", "hi", "hu", "is", "id", "ga", "it", "ja", "kn", "kk", "ko", "lv", "lt", "mk", "ms", 
    "ml", "mt", "mr", "mn", "no", "ps", "pl", "pt", "pt-PT", "pa", "ro", "ru", "sr", "si", "sk", "sl", "so", "es", "es-MX", "sw", "sv", "ta", "te", "th", 
    "tr", "uk", "ur", "uz", "vi", "cy"].map(lang => ({ label: lang, value: lang }))

export const createTranslateClient = (config) => { translateClient = new TranslateClient(config) }

export const translateText = async (text, sourceLang, targetLang) => {
    const input = { // TranslateTextRequest
        Text: text,
        SourceLanguageCode: sourceLang,
        TargetLanguageCode: targetLang,
    };

    const command = new TranslateTextCommand(input);
    const response = await translateClient.send(command);

    return response.TranslatedText

}