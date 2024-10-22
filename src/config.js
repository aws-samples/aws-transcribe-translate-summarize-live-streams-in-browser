// DO NOT COMMIT AWS resources IDs to your git repository
const config = {
    "aws_project_region": "{aws_region}", // The same you have used as aws_region in cdk/bin/config.json
    "bedrock_region": "{bedrock_region}", // The same you have used as bedrock_region in cdk/bin/config.json
    "APIGatewayId": "{APIGatewayId}", // From CloudFormation outputs
    "BucketS3Name": "{BucketS3Name}", // From CloudFormation outputs
    "CognitoIdentityPoolId": "{CognitoIdentityPoolId}", // From CloudFormation outputs
    "CognitoUserPoolClientId": "{CognitoUserPoolClientId}", // From CloudFormation outputs
    "CognitoUserPoolId": "{CognitoUserPoolId}", // From CloudFormation outputs
};

exports.module = config