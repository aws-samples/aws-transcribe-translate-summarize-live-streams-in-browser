import json
import boto3
import os
from botocore.config import Config
from helpers import retrieve_complete_transcription, generate_prompt, generate_summary, save_summary_to_s3

output_bucket = os.environ['BUCKET_S3']
region = os.environ['BEDROCK_REGION']

s3_client = boto3.client('s3')
bedrock_runtime = boto3.client('bedrock-runtime', config=Config(
    region_name=region,
))
bedrock_client = boto3.client('bedrock', config=Config(
    region_name=region,
))

claude3_id = "anthropic.claude-3-sonnet-20240229-v1:0"
claude2_id = "anthropic.claude-v2:1"

def lambda_handler(event, context):
    body = json.loads(event['body'])
    print("body")
    print(body)
    
    audio_id = body["audio_id"]
    original_language = body["original_language"]
    translation_language = body["translation_language"]
    original_text = body["original_text"]
    translated_text = body["translated_text"]
    type_of_audio = body["type_of_audio"]
    
    output_key = f"results_{audio_id}.txt"
    print("region")
    print(region)

    if translation_language in ['en', 'es', 'es-MX', 'fr', 'fr-CA', 'it', 'de', 'pt', 'pt-PT', 'nl', 'ru', 'ar', 'zh', 'zh-TW', 'ja', 'ko']:
        new_content = translated_text
        summary_language = translation_language
    elif original_language in  ['en-GB','es-ES','fr-FR', 'it-IT','de-DE','pt-PT','nl-NL','ru-RU', 'ar-AR', 'zh-CN', 'ja-JP','ko-KR']:
        new_content = original_text
        summary_language = original_language
    else:
        return {
            'statusCode': 400,
            'body': json.dumps("Summary is not supported for this pair of languages")
        }
    

    # Call the ListFoundationalModels API
    foundational_models = bedrock_client.list_foundation_models()
    # Check if Claude 3 is available in the region
    claude3_available = False
    for model in foundational_models['modelSummaries']:
        if model['modelId'] == claude3_id:
            claude3_available = True
            break
        
    selected_model = claude3_id if claude3_available else claude2_id

    transcription = retrieve_complete_transcription(output_bucket, output_key, new_content, type_of_audio, s3_client)
    summary = generate_summary(transcription, bedrock_runtime, selected_model)
    save_summary_to_s3(summary, output_bucket, output_key, s3_client)
    print("summary done")

    return {
        'statusCode': 200,
        'body': json.dumps({
            "message": "Successfully summarized.",
            "summary_language": summary_language
        })
    }
