# AWS Transcribe, translate and summarize live streams in your browser with AWS AI and Generative AI services

## Overview

This is a real time transcription and translation Chrome extension. It will transcribe your meeting and provide a translation in the desired language. After the meeting is over, it will provide a summary of the key points.

It is built on AWS Cloud and it is based on the following services:
- Amazon Transcribe to transcribe the meeting/video, including automatic detection of the audio language;
- Amazon Translate to translate the meeting/video to the desired language;
- Amazon Bedrock to summarize the transcription of the meeting/video and store it on Amazon S3.

The whole sample uses services and resources in your AWS account.

### Example
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
    "aws_project_region": "{aws_region}", // The same you have used as aws_region in cdk/config.json
    "bedrock_region": "{bedrock_region}", // The same you have used as bedrock_region in cdk/config.json
    "APIGatewayId": "{APIGatewayId}", // From CloudFormation outputs
    "BucketS3Name": "{BucketS3Name}", // From CloudFormation outputs
    "CognitoIdentityPoolId": "{CognitoIdentityPoolId}", // From CloudFormation outputs
    "CognitoUserPoolClientId": "{CognitoUserPoolClientId}", // From CloudFormation outputs
    "CognitoUserPoolId": "{CognitoUserPoolId}", // From CloudFormation outputs
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
    - Click on Extensions > AWS transcribe, translate and summarize > Details >  Site Settings > Microphone > Allow.

8. Go to [Cognito User Pools](https://us-east-1.console.aws.amazon.com/cognito/v2/idp/user-pools?region=us-west-2) and create a new user.

## Running this extension

1. Click the extension's action icon to start recording. :exclamation: *The icon must be clicked when you are on the same page you want to record from!* :exclamation: 
2. Open the sidepanel and choose the **AWS transcribe, translate and summarize** panel.
3. Click the `Start recording` button again to start recording.
4. Click the `Stop recording` button again to stop recording.

## Troubleshooting

- If the extension is not working:
    - Make sure you are using it on the tab where you first opened the sidepanel. If you want to use it on a different tab, stop the extension, close the sidepanel and click on the extension icon again to run it (as "Running this extension" section).
    - Make sure you have given permissions for audio recording in the web browser.

- If you can't get the summary of video/meeting, make sure you have stopped the recording and then request the summary.

## Clean up
- To clean up the summary of the conversations in the Amazon S3 Bucket, navigate to the `Clean up` tab and click the `Clear all conversations`.
- To clean up the backend resources, look at the instructions on [cdk/README.md](cdk/README.md).


## License
This repo is licensed under the [MIT-0 license](/LICENSE).


## Contributors
This project is developed and maintaned by Chiara Relandini ([GitHub](https://github.com/chiararelandini), [Linkedin](https://www.linkedin.com/in/chiara-relandini/)), Arian Rezai Tabrizi ([GitHub](https://github.com/arianrezai), [Linkedin](https://www.linkedin.com/in/arianrezai/)) and Luca Guida ([GitHub](https://github.com/l-guida), [Linkedin](https://www.linkedin.com/in/lucaguida/)).