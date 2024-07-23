#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsStreamAnalysisStack } from '../lib/cdk-real-time-aws-extension-stack';
import { AwsSolutionsChecks } from 'cdk-nag'
import { Aspects } from 'aws-cdk-lib';
import { getConfig } from './config';

// get configuration
const config = getConfig();

const app = new cdk.App();
// Add the cdk-nag AwsSolutions Pack with extra verbose logging enabled.
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))
new AwsStreamAnalysisStack(app, 'RealTimeAwsMeetingExtensionTestStack', {
    config,
    env: {
      region: process.env.CDK_DEFAULT_REGION,
      account: process.env.CDK_DEFAULT_ACCOUNT,
    },
});