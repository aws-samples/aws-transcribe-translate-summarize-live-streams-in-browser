import { CfnOutput, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import { NagSuppressions } from 'cdk-nag'

export interface CognitoProps {
  readonly prefix: string, // Prefix from the configuration
  readonly region: string, // Region from the configuration
  readonly account: string, // AWS Account
}

export class Cognito extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly client: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;
  public readonly defaultPolicy: cognito.CfnIdentityPoolRoleAttachment;
  public readonly authenticatedRole: iam.Role;

  constructor(scope: Construct, id: string, props: CognitoProps) {
    super(scope, id);

    // Create a new Cognito User Pool
    // Remediating AwsSolutions-COG2 by disabling self sign up.
    this.userPool = new cognito.UserPool(this, "real-time-aws-extension-user_pool", {
      userPoolName: `real-time-aws-extension-user-pool-${props.prefix}`,
      signInCaseSensitive: false, // Sign-in is not case-sensitive
      selfSignUpEnabled: false, // Allow users to sign up
      autoVerify: { email: true }, // Verify email addresses by sending a verification code
      signInAliases: {
        email: true, // Allow sign-in with email
      },
      accountRecovery: cognito.AccountRecovery.NONE, // No account recovery mechanism
      advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED, // https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-settings-advanced-security.html
                                                                   //  adds security feature but costs more than plain cognito.
      passwordPolicy: {
        minLength: 8, // Minimum length of password is 8 characters
        requireDigits: true, // Require at least one digit in password
        requireLowercase: true, // Require at least one lowercase letter in password
        requireSymbols: true, // Require at least one symbol in password
        requireUppercase: true, // Require at least one uppercase letter in password
        tempPasswordValidity: Duration.days(3),
      },
    });
    NagSuppressions.addResourceSuppressions(this.userPool, [
      {
        id: 'AwsSolutions-COG2',
        reason: 'MFA is not strictly required, since users can be only signed up by administrator on AWS console.'
      },
    ])

    // Create a new Cognito User Pool Client for the application
    this.client = this.userPool.addClient("RealtimeAWSExtension", {
      oAuth: {
        flows: {
          authorizationCodeGrant: true, // Enable Authorization Code Grant flow
        },
        scopes: [
          cognito.OAuthScope.OPENID, // Include OpenID scope
          cognito.OAuthScope.EMAIL, // Include email scope
          cognito.OAuthScope.PHONE, // Include phone number scope
          cognito.OAuthScope.PROFILE, // Include profile scope
        ],
      },
      userPoolClientName: `${props.prefix}-RealtimeAWSExtension`, // Client name
      preventUserExistenceErrors: true, // Prevent user existence errors
    });

    this.identityPool = new cognito.CfnIdentityPool(this, "IdentityPool", {
      allowUnauthenticatedIdentities: false, // Don't allow unathenticated users
      cognitoIdentityProviders: [
        {
          clientId: this.client.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });

    this.authenticatedRole = new iam.Role(this, 'CognitoDefaultAuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
          "StringEquals": { "cognito-identity.amazonaws.com:aud": this.identityPool.ref },
          "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
      }, "sts:AssumeRoleWithWebIdentity")
    });

    // add policy to invoke API Gateway
    this.authenticatedRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        "execute-api:Invoke",
      ],
      resources: [`arn:aws:execute-api:${props.region}:*:*/*/*/*`]
    }))

    // add policy to invoke Amazon Transcribe
    this.authenticatedRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        "transcribe:StartStreamTranscriptionWebSocket",
      ],
      resources: ["*"]
    }))

    // add policy to invoke Amazon Translate
    this.authenticatedRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        "translate:TranslateText",
      ],
      resources: [`*`]
    }))

    NagSuppressions.addResourceSuppressions(this.authenticatedRole, [
      {
        id: 'AwsSolutions-IAM5',
        reason: 'API id is not yet available, since API Gateway has a dependency on Cognito user pool to be created before as an authorizer.',
        appliesTo: [`Resource::arn:aws:execute-api:${props.region}:*:*/*/*/*`]
      },
      {
        id: 'AwsSolutions-IAM5',
        reason: 'Amazon Transcribe and Translate are restricted on actions to the most granular level.',
        appliesTo: [`Resource::*`]
      },
    ], true)
    
    this.defaultPolicy = new cognito.CfnIdentityPoolRoleAttachment(this, 'DefaultValid', {
        identityPoolId: this.identityPool.ref,
        roles: {
            'authenticated': this.authenticatedRole.roleArn
        }
    });

    // Output the User Pool ID as a CloudFormation output
    new CfnOutput(this, "UserPoolId", {
      key: 'CognitoUserPoolId',
      value: this.userPool.userPoolId,
      description: "Cognito User Pool ID",
    });
    new CfnOutput(this, "UserPoolClientId", {
      key: 'CognitoUserPoolClientId',
      value: this.client.userPoolClientId,
      description: "Cognito User Pool Client ID",
    });
    new CfnOutput(this, "IdentityPoolId", {
      key: 'CognitoIdentityPoolId',
      value: this.identityPool.ref,
      description: "Cognito Identity Pool ID",
    });
  }
}
