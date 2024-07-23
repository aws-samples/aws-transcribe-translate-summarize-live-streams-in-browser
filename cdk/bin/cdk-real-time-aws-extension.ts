#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsStreamAnalysisStack } from '../lib/cdk-real-time-aws-extension-stack';
import { getConfig } from "./config";

// Creating a new instance of the AWS CDK App, which represents the root of the CDK application.
const app = new cdk.App();

// get configuration
const config = getConfig();

new AwsStreamAnalysisStack(app, `AwsStreamAnalysisStack-${config.prefix}`, {
  config,
  env: {
    region: config.aws_region,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});