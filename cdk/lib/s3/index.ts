import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";

export interface S3Props {
  readonly bucketName: string;
}

export class S3Construct extends Construct {
  public bucket: s3.Bucket;
  public bucketArn: string

  constructor(parent: Construct, name: string, props: S3Props) {
    super(parent, name);

    const s3Bucket = new s3.Bucket(this, "Bucket", {
      autoDeleteObjects: true,
      bucketName: props.bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
    });

    NagSuppressions.addResourceSuppressions(s3Bucket, [
      {
        id: 'AwsSolutions-S1',
        reason: 'S3 Bucket can be accessed only by the lambda function and logging is already enabled.'
      },
    ])

    new CfnOutput(this, `${name}-bucket`, {
      key: 'BucketS3Name',
      value: props.bucketName,
      description: 'Bucket name to store conversations'
    });

    this.bucket = s3Bucket;
    this.bucketArn = s3Bucket.bucketArn
  }
}