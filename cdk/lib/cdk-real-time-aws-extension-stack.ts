import { Construct } from 'constructs';
import { Stack, StackProps } from "aws-cdk-lib";
import { SystemConfig } from '../bin/config';
import { Cognito } from './authentication';
import { LambdaIamConstruct } from './iam';
import { LambdaConstruct } from './lambda';
import { S3Construct } from './s3';
import { APIGatewayConstruct } from './api-gateway';


// Interface to define the properties for the FoundationalLlmChatStack
export interface RealtimeAWSExtensionStackProps extends StackProps {
  readonly config: SystemConfig;
}

export class AwsStreamAnalysisStack extends Stack {
  constructor(scope: Construct, id: string, props: RealtimeAWSExtensionStackProps) {
    super(scope, id, props);

    const randomPrefix = Math.floor(Math.random() * (1000000 - 100) + 100);
    const bucketName = `${props.config.bucket_name}-${randomPrefix}`

    // Create an instance of the Cognito construct
    const cognito = new Cognito(this, "Cognito", {
      prefix: props.config.prefix,
      region: props.config.aws_region,
      account: this.account
    });

    // Create Bucket S3
    const s3Construct = new S3Construct(this, `BucketS3Construct`, { bucketName });

    // Create Lamba roles
    const summarizeLambdaRole = new LambdaIamConstruct(this, `SummarizeLambdaIamConstruct`, { 
      roleName: `SummarizeLambdaRole-${props.config.prefix}`,
      bedrockAccess: true,
      translateAccess: false,
      region: props.config.aws_region,
      account: this.account,
      bedrock_region: props.config.bedrock_region,
      bucketName
    });

    const retrieveSummaryLambdaRole = new LambdaIamConstruct(this, `RetrieveSummaryLambdaIamConstruct`, { 
      roleName: `RetrieveSummaryLambdaRole-${props.config.prefix}`,
      bedrockAccess: false,
      translateAccess: true,
      region: props.config.aws_region,
      account: this.account,
      bedrock_region: props.config.bedrock_region,
      bucketName
    });

    const clearBucketLambdaRole = new LambdaIamConstruct(this, `ClearBucketLambdaIamConstruct`, { 
      roleName: `ClearBucketLambdaRole-${props.config.prefix}`,
      bedrockAccess: false,
      translateAccess: false,
      region: props.config.aws_region,
      account: this.account,
      bedrock_region: props.config.bedrock_region,
      bucketName
    });

    // Create Lambdas
    const summarizeLambda = new LambdaConstruct(this, `SummarizeLambdaConstruct`, {
      lambdaName: `SummarizeLambda`,
      prefix: props.config.prefix,
      lambdaFileHandler: "lambda_function",
      lambdaCodeFolder: "summarize-conversation",
      iamRole: summarizeLambdaRole.lambdaRole,
      bucketName: bucketName,
      bedrockRegion: props.config.bedrock_region,
      bedrockModelID: props.config.bedrock_model_id
    });

    const retrieveSummaryLambda = new LambdaConstruct(this, `RetrieveSummaryLambdaConstruct`, {
      lambdaName: `RetrieveSummaryLambda`,
      prefix: props.config.prefix,
      lambdaFileHandler: "retrieve_bedrock_summary",
      lambdaCodeFolder: "retrieve-summary",
      iamRole: retrieveSummaryLambdaRole.lambdaRole,
      bucketName: bucketName,
      bedrockRegion: null,
      bedrockModelID: null
    });

    const clearBucketLambda = new LambdaConstruct(this, `ClearBucketLambdaConstruct`, {
      lambdaName: `ClearBucketLambda`,
      prefix: props.config.prefix,
      lambdaFileHandler: "delete_all",
      lambdaCodeFolder: "clear-bucket",
      iamRole: clearBucketLambdaRole.lambdaRole,
      bucketName: bucketName,
      bedrockRegion: null,
      bedrockModelID: null
    });

    // Create API Gateway
    const apiGatewayConstruct = new APIGatewayConstruct(this, `APIGatewayConstruct`, {
      userPool: cognito.userPool,
      lambdaSummarization: summarizeLambda.lambda,
      lambdaRetrieveSummary: retrieveSummaryLambda.lambda,
      lambdaClearBucket: clearBucketLambda.lambda,
      apiName: `RealTimeAWSExtensionAPI-${props.config.prefix}`
    })

  }
}
