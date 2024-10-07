# Transcribe, translate and summarize live streams in your browser with AWS AI and Generative AI services

## Overview

This is a real time transcription and translation Chrome extension. It will transcribe your live stream and provide a translation in the desired language. After the live stream is over, it will provide a summary of the key points.

It is built on AWS Cloud and it is based on the following services:
- Amazon Transcribe to transcribe the meeting/video, including automatic detection of the audio language;
- Amazon Translate to translate the meeting/video to the desired language;
- Amazon Bedrock to summarize the transcription of the meeting/video and store it on Amazon S3.

The whole sample uses services and resources in your AWS account.

### Example

See an example of how the extension works in the video below.

<img src="/assets/chrome_extension.gif"/>

### Architecture
This is the architecture of the AWS services used to build the browser extension:
![Architecture](/assets/architecture.png)

## Installation

1. Clone this repository.
2. Deploy the backend through AWS CDK, following the instructions on [cdk/README.md](cdk/README.md).
3. **Important**: if you followed the automated step described in [cdk/README.md](cdk/README.md) executing the postdeploy script to configure the variables, you don't need to copy/paste the values manually (just check that the values have been populated). Otherwise, populate the [src/config.js](src/config.js) with AWS CloudFormation outputs.
```js
const config = {
    "aws_project_region": "{aws_region}",
    "bedrock_region": "{bedrock_region}",
    "APIGatewayId": "{APIGatewayId}",
    "BucketS3Name": "{BucketS3Name}",
    "CognitoIdentityPoolId": "{CognitoIdentityPoolId}",
    "CognitoUserPoolClientId": "{CognitoUserPoolClientId}",
    "CognitoUserPoolId": "{CognitoUserPoolId}"
};
```

4. Install dependencies and build the package:
```bash
cd {repo_name} # Make sure you navigate to repo root directory if you are in /cdk folder from previous steps
npm i
npm run build
```
5. Open Google Chrome browser and go to `chrome://extensions/` link. Ensure **developer mode** is enabled.
6. Load the `build`  directory in Chrome as an **unpacked extension**.
7. Make sure you have granted permissions to your browser to record your screen and audio. You can check it under *details* of the extension. To enable access to microphone: 
    - Click on Extensions > Transcribe, translate and summarize live streams (powered by AWS) > Details >  Site Settings > Microphone > Allow.

8. Go to [Cognito User Pools](https://us-east-1.console.aws.amazon.com/cognito/v2/idp/user-pools?region=us-west-2) and create a new user.


### Extension configuration
See a walkthrough of the browser configuration steps (5-7) in the video below.

<img src="/assets/extension_settings.gif"/>


## Running this extension

1. Click the extension's action icon to start recording. :exclamation: *The icon must be clicked when you are on the same page you want to record from!* :exclamation: 
2. Open the sidepanel and choose the **Transcribe, translate and summarize live streams (powered by AWS)** panel.
3. Use the Settings panel to update the settings of the application:
    - **mic in use toggle**: 'mic not in use' is used to record only the audio of the browser tab for a live video streaming, while 'mic in use' is used for a real-time meeting where your michrophone is recorded as well
    - **Transcription language**: language of the live stream to be recorded (set to 'auto' to allow automatic identification of the language)
    - **Translation language**: language in which the live stream will be translated and the summary will be printed. Once you've chosen the translation language and started the recording, you cannot change your choice for the ognoing live stream. In order to change translation language for transcript and summary, you will have to record it from scratch.
4. Click the `Start recording` button again to start recording.
5. Click the `Stop recording` button again to stop recording.

## Troubleshooting

- If the extension is not working:
    - [**Error: Extension has not been invoked for the current page (see activeTab permission). Chrome pages cannot be captured.**] Make sure you are using it on the tab where you first opened the sidepanel. If you want to use it on a different tab, stop the extension, close the sidepanel and click on the extension icon again to run it (as "Running this extension" section).
    - Make sure you have given permissions for audio recording in the web browser.

- If you can't get the summary of the live stream, make sure you have stopped the recording and then request the summary. You cannot change the language of the transcript and summary after the recording has started, so remember to choose it appropriately before you start the recording.

## Clean up
- To clean up the summary of the conversations in the Amazon S3 Bucket, navigate to the `Clean up` tab and click the `Clear all conversations`.
- To clean up the backend resources, look at the instructions on [cdk/README.md](cdk/README.md).


## License
This repo is licensed under the [MIT-0 license](/LICENSE).


## Contributors
This project is developed and maintaned by Chiara Relandini ([GitHub](https://github.com/chiararelandini), [Linkedin](https://www.linkedin.com/in/chiara-relandini/)), Arian Rezai Tabrizi ([GitHub](https://github.com/arianrezai), [Linkedin](https://www.linkedin.com/in/arianrezai/)) and Luca Guida ([GitHub](https://github.com/l-guida), [Linkedin](https://www.linkedin.com/in/lucaguida/)).