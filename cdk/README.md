# AWS Transcribe, translate and summarize live streams in your browser with AWS AI and Generative AI services - Backend

This is the backend project for your AWS Transcribe, translate and summarize live streams in your browser with AWS AI and Generative AI services Extension.

## Prerequisites
* You need to have `node` installed. The project was tested with `node v20.12.0`.
* You need to have access to an AWS Account via cli.
* You need to have installed and bootstrapped cdk on your <aws_account> in the <aws_region> you have choosen.

## Security disclaimer for production workload :exclamation:
Best practice is to have AWS WAF in front of the API Gateway as a web application firewall that helps protect web applications and APIs from attacks by allowing configured rules to allow, block, or monitor (count) web requests based on customizable rules and conditions that are defined. 

In this repository, WAF is not enabled, but it is highly recommended to enable it for production workload.


## Installing the backend

* Open `cdk/config.json` file and populate the configuration variables.
```json
{
  "prefix": "aaa1234", // A random prefix to differentiate the deploy
  "aws_region": "us-west-2", // The AWS Region where you want to deploy the project
  "bedrock_region": "us-west-2", // The AWS Region where you have access to Amazon Bedrock models
  "bucket_name": "summarization-test", // The name you want to give to the Amazon S3 Bucket where conversation summaries will be stored. The name will be automatically suffixed with a random string.
  "bedrock_model_id": "anthropic.claude-3-sonnet-20240229-v1:0" // The ID of the Amazon Bedrock model to summarize the conversation - you can find the complete list here https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html
}

```
* `bedrock_region` can be different from `aws_region` since you might have access to Amazon Bedrock model in a region different from the region where you want to deploy the project. By default the project will use Claude 3 Sonnet, but you can change the `bedrock_model_id` in the configuration file. Find the complete list of model ids on the [doc](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html).
* Make sure you have allowed access to the model in the desired region following instructions [here](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html).
* In a terminal window, login to your AWS Account.
* Navigate to directory `{repo_name}/cdk`.
* Execute the following command: `npx cdk deploy` to deploy this stack to your AWS account in the AWS_REGION specified in the `config.aws_region`.
* Confirm the deploy of the listed resources and wait for AWS CloudFormation to finish creating the stack.
* You will need to use CloudFormation outputs to connect your frontend to the backend, so you have two possibilities:
  - wait for outputs to be printed in the terminal window,
  - open the AWS Console and go to [AWS CloudFormation](https://us-west-2.console.aws.amazon.com/cloudformation/home) in the region where you have deployed the stack, then choose the just created stack and look for the `Outputs` tabs.
* Go on to next step [here](../README.md).

## Clean up
To clean up all backend resources on your AWS account, you need to run the command: `npx cdk destroy`.

:exclamation: The AWS Cognito resources won't be destroyed, so you have to open the AWS Console and delete them manually :exclamation: