// DO NOT COMMIT AWS resources IDs to your git repository
const config = {
    "aws_project_region": "{aws_region}", // The same you have used as aws_region in cdk/config.json
    "aws_cognito_identity_pool_id": "{CognitoIdentityPoolId}", // From CloudFormation outputs
    "aws_user_pools_id": "{CognitoUserPoolId}", // From CloudFormation outputs
    "aws_user_pools_web_client_id": "{CognitoUserPoolClientId}", // From CloudFormation outputs
    "bucket_s3": "{BucketS3Name}", // From CloudFormation outputs
    "bedrock_region": "{bedrock_region}", // The same you have used as bedrock_region in cdk/config.json
    "api_gateway_id": "{APIGatewayId}" // From CloudFormation outputs
};

exports.module = config