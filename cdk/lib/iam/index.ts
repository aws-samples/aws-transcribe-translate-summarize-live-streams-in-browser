import { Token } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";

export interface LambdaIamProps {
  readonly roleName: string;
  readonly bedrockAccess: boolean;
  readonly translateAccess: boolean;
  readonly region: string;
  readonly account: string;
  readonly bedrock_region: string;
  readonly bucketName: string;
}

export class LambdaIamConstruct extends Construct {
  public lambdaRole: iam.Role;

  constructor(scope: Construct, name: string, props: LambdaIamProps) {
    super(scope, name);

    const lambdaRole = new iam.Role(this, props.roleName, {
      roleName: props.roleName,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    // add policy to manage logs on Amazon CloudWatch
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      resources: ["*"]
    }))

    // add policy to access Amazon S3
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        "s3:ListBucket", "s3:GetBucketLocation",
        "s3:PutObject", "s3:GetObject", "s3:DeleteObject"
      ],
      resources: [ `arn:aws:s3:::${props.bucketName}`, `arn:aws:s3:::${props.bucketName}/*` ]
    }))

    if(props.bedrockAccess){
      // add policy to access Amazon Bedrock
      lambdaRole.addToPolicy(new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel"
        ],
        resources: [`arn:aws:bedrock:${props.bedrock_region}::foundation-model/anthropic.*`]
      }))
      lambdaRole.addToPolicy(new iam.PolicyStatement({
        actions: [
          "bedrock:ListFoundationModels"
        ],
        resources: ["*"]
      }))
    }

    if(props.translateAccess){
      // add policy to access Amazon Translate
      lambdaRole.addToPolicy(new iam.PolicyStatement({
        actions: [
          "translate:TranslateText"
        ],
        resources: ["*"]
      }))
    }

    NagSuppressions.addResourceSuppressions(lambdaRole, [
      {
        id: 'AwsSolutions-IAM5',
        reason: 'IAM policy actions restricted, while resources are restricted to the most granular level.',
        appliesTo: ["Resource::*", `Resource::arn:aws:s3:::${props.bucketName}`, `Resource::arn:aws:s3:::${props.bucketName}/*`, `Resource::arn:aws:bedrock:${props.bedrock_region}::foundation-model/anthropic.*`]
      },
    ], true)

    this.lambdaRole = lambdaRole;
  }
}