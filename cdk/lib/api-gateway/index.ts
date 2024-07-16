import { CfnOutput } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { NagSuppressions } from "cdk-nag";

export interface APIgwProps {
    readonly apiName: string;
    readonly lambdaSummarization: lambda.Function;
    readonly lambdaRetrieveSummary: lambda.Function;
    readonly lambdaClearBucket: lambda.Function;
    readonly userPool: cognito.UserPool
}
  
export class APIGatewayConstruct extends Construct {
    public apiId: string;

    constructor(parent: Construct, name: string, props: APIgwProps) {
        super(parent, name);
        
        const prodLogGroup = new logs.LogGroup(this, "ProdLogs");

        const api = new apigateway.RestApi(this, `${props.apiName}APIGateway`, {
            restApiName: props.apiName,
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: apigateway.Cors.DEFAULT_HEADERS
            },
            cloudWatchRole: true,
            deployOptions: {
                stageName: 'prod',
                accessLogDestination: new apigateway.LogGroupLogDestination(prodLogGroup),
                accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
            }
        });

        const auth = new apigateway.CognitoUserPoolsAuthorizer(this, `${props.apiName}Authorizer`, {
            cognitoUserPools: [props.userPool]
        });
        const methodOptions = {
            authorizer: auth,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true
                    },
                    responseModels: {
                        'application/json': apigateway.Model.EMPTY_MODEL
                    }
                }
            ]
        }

        const summarizationPath = api.root.addResource('summarization'); 
        summarizationPath.addMethod('POST', new apigateway.LambdaIntegration(props.lambdaSummarization, {
            proxy: true,
        }), methodOptions);
    
        const summaryPath = api.root.addResource('summary'); 
        summaryPath.addMethod('GET', new apigateway.LambdaIntegration(props.lambdaRetrieveSummary, {
            proxy: true,
        }), methodOptions);
        summaryPath.addMethod('DELETE', new apigateway.LambdaIntegration(props.lambdaClearBucket, {
            proxy: true,
        }), methodOptions);

        NagSuppressions.addResourceSuppressions(api, [{
            id: 'AwsSolutions-APIG2',
            reason: 'Validation is performed inside the lambda functions which are integrated with the API.'
        }, {
            id: 'AwsSolutions-APIG4',
            reason: 'OPTIONS route must be unauthorized to enable CORS.'
        }, {
            id: 'AwsSolutions-COG4',
            reason: 'OPTIONS route must be unauthorized to enable CORS.'
        }, {
            id: 'AwsSolutions-APIG6',
            reason: 'Logs are enabled at API root level.'
        }], true)
    
        const deployment = new apigateway.Deployment(this, `${props.apiName}APIGatewayDeployment`, {
            api,
        });

        NagSuppressions.addResourceSuppressions(deployment, [{
            id: 'AwsSolutions-APIG3',
            reason: 'Deployment does not require WAF since it can be invoked only by authorized clients.'
        }], true)

        new CfnOutput(this, `${props.apiName}APIGatewayId`, {
            key: 'APIGatewayId',
            value: api.restApiId,
            description: `${props.apiName} Rest API Gateway id`,
        });

        this.apiId = api.restApiId;
    }
}