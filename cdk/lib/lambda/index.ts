import * as aws_lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";
import { CfnOutput, Duration } from 'aws-cdk-lib';

export interface LambdaProps {
  readonly lambdaName: string;
  readonly lambdaFileHandler: string;
  readonly lambdaCodeFolder: string;
  readonly iamRole: iam.Role;
  readonly bucketName: string;
  readonly bedrockRegion: string | null;
  readonly prefix: string;
}

const defaultProps: Partial<LambdaProps> = {};

export class LambdaConstruct extends Construct {
  public lambdaArn: string;
  public lambda: aws_lambda.Function;

  constructor(scope: Construct, name: string, props: LambdaProps) {
    super(scope, name);

    props = { ...defaultProps, ...props };

    const lambda = new aws_lambda.Function(this, `${props.lambdaName}-${props.prefix}` , {
      runtime: aws_lambda.Runtime.PYTHON_3_12,
      handler: `${props.lambdaFileHandler}.lambda_handler`,
      code: aws_lambda.Code.fromAsset(`lib/assets/lambdas/${props.lambdaCodeFolder}`),
      timeout: Duration.seconds(300),
      role: props.iamRole,
      environment: { 
        BUCKET_S3: props.bucketName,
        ...(props.bedrockRegion ? { BEDROCK_REGION: props.bedrockRegion } : { })
    }
    });

    new CfnOutput(this, `${props.lambdaName}LambdaArn`, {
        key: `${props.lambdaName}LambdaArn`,
        value: lambda.functionArn,
        description: props.lambdaName,
    });

    this.lambdaArn = lambda.functionArn;
    this.lambda = lambda;
  }
}