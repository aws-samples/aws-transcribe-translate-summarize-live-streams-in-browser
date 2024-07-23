// generate-aws-exports.js
const fs = require('fs');
const path = require('path');

// Path to the config.js file
const configModule = require('../src/config');
const config = configModule.module;

// Path to the output aws-exports.js file
const awsExportsFilePath = path.join(__dirname, '../src/aws-exports.js');

// Create the aws-exports.js file content
const awsExportsContent = `
const awsConfig = {
  "aws_project_region": "${config.aws_project_region}",
  "aws_cognito_identity_pool_id": "${config.CognitoIdentityPoolId}",
  "aws_cognito_region": "${config.aws_project_region}",
  "aws_user_pools_id": "${config.CognitoUserPoolId}",
  "aws_user_pools_web_client_id": "${config.CognitoUserPoolClientId}",  
  "oauth": {},
  "aws_cognito_username_attributes": [
      "EMAIL"
  ],
  "aws_cognito_social_providers": [],
  "aws_cognito_signup_attributes": [
      "EMAIL"
  ],
  "aws_cognito_mfa_configuration": "OFF",
  "aws_cognito_mfa_types": [
      "SMS"
  ],
  "aws_cognito_password_protection_settings": {
      "passwordPolicyMinLength": 8,
      "passwordPolicyCharacters": []
  },
  "aws_cognito_verification_mechanisms": [
      "EMAIL"
  ],
  "aws_user_files_s3_bucket": "",
  "aws_user_files_s3_bucket_region": "${config.aws_project_region}"
};

export default awsConfig;
`;

// Write the aws-exports.js file
fs.writeFileSync(awsExportsFilePath, awsExportsContent);

console.log('aws-exports.js file generated successfully!');
