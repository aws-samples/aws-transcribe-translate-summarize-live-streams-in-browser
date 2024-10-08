#!/bin/sh

## First extract config from CDK config variables
CDK_CONFIG_FILE="./bin/config.json"

# Extract the value of the "aws_region" and "bedrock_region" key from the JSON file
aws_region=$(sed -n 's/^.*"aws_region": "\([^"]*\)".*$/\1/p' "$CDK_CONFIG_FILE")
bedrock_region=$(sed -n 's/^.*"bedrock_region": "\([^"]*\)".*$/\1/p' "$CDK_CONFIG_FILE")
PREFIX=$(sed -n 's/^.*"prefix": "\([^"]*\)".*$/\1/p' "$CDK_CONFIG_FILE")

# Check if the "aws_region" key was found
if [ -z "$aws_region" ]; then
    echo "Error: 'aws_region' key not found in the JSON file."
    exit 1
fi

# Check if the "bedrock_region" key was found
if [ -z "$bedrock_region" ]; then
    echo "Error: 'bedrock_region' key not found in the JSON file."
    exit 1
fi

aws_region_json="\"aws_project_region\": \"$aws_region\""
bedrock_region_json="\"bedrock_region\": \"$bedrock_region\""

## Then extract the outputs of the stack
# Set the stack name
stack_name="AwsStreamAnalysisStack-$PREFIX"
echo "stack_name: $stack_name"

api_gateway_id=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='APIGatewayId'].OutputValue" --output text --region $aws_region)
bucket_s3_name=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='BucketS3Name'].OutputValue" --output text --region $aws_region)
user_pool_id=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolId'].OutputValue" --output text --region $aws_region)
identity_pool_id=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='CognitoIdentityPoolId'].OutputValue" --output text --region $aws_region)
web_client_id=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolClientId'].OutputValue" --output text --region $aws_region)

# Check if the "APIGatewayId" output is present
if [ -z "$api_gateway_id" ]; then
    echo "Error: No 'APIGatewayId' output found for stack '$stack'"
    exit 1
fi

output_file="../src/config.js"

api_gateway_id_json="\"APIGatewayId\": \"$api_gateway_id\""
bucket_s3_name_json="\"BucketS3Name\": \"$bucket_s3_name\""
user_pool_id_json="\"CognitoUserPoolId\": \"$user_pool_id\""
identity_pool_id_json="\"CognitoIdentityPoolId\": \"$identity_pool_id\""
web_client_id_json="\"CognitoUserPoolClientId\": \"$web_client_id\""

echo "// DO NOT COMMIT AWS resources IDs to your git repository
const config = {
    $aws_region_json, // The same you have used as aws_region in cdk/bin/config.json
    $bedrock_region_json, // The same you have used as bedrock_region in cdk/bin/config.json
    $api_gateway_id_json, // From CloudFormation outputs
    $bucket_s3_name_json, // From CloudFormation outputs
    $identity_pool_id_json, // From CloudFormation outputs
    $web_client_id_json, // From CloudFormation outputs
    $user_pool_id_json, // From CloudFormation outputs
};

exports.module = config" > "$output_file"

echo "Configuration file 'src/config.js' created successfully."