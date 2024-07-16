import boto3
import os
import json

bucket_name = os.environ['BUCKET_S3']

def lambda_handler(event, context):
    print(event)
    parameters = event['queryStringParameters']
    print("parameters")
    print(parameters)
    
    # Extract parameters from the body
    audio_id = parameters["audio_id"]
    summary_language = parameters['summary_language']
    translation_language = parameters['translation_language']

    # Create S3 client
    s3 = boto3.client('s3')
    
    # Retrieve text file from S3
    file_key = f"results_{audio_id}.txt"
    try:
        response = s3.get_object(Bucket=bucket_name, Key=file_key)
        text = response['Body'].read().decode('utf-8')
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error retrieving file from S3: {str(e)}")
        }
    
    # Check if summary_language matches translation_language
    if summary_language == translation_language:
        print("success without translation")
        print(text)
        return {
            'statusCode': 200,
            'body': json.dumps({'summary': text})
        }
    else:
        # Translate text using Amazon Translate
        translate = boto3.client('translate')
        try:
            translation_response = translate.translate_text(
                Text=text,
                SourceLanguageCode=summary_language,
                TargetLanguageCode=translation_language
            )
            translated_text = translation_response['TranslatedText']
        except Exception as e:
            print("error")
            print(e)
            return {
                'statusCode': 500,
                'body': json.dumps(f"Error translating text: {str(e)}")
            }
        
        print("success with translation")
        print(translated_text)
        return {
            'statusCode': 200,
            'body': json.dumps({'summary': translated_text})
        }
