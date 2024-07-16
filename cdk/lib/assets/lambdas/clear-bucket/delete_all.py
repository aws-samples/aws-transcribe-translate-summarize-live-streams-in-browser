import boto3
import os
import json

# Create S3 client
s3 = boto3.client('s3')

# Define the bucket name
BUCKET_NAME = os.environ['BUCKET_S3']

def lambda_handler(event, context):
    # Get a list of all objects in the S3 bucket
    response = s3.list_objects_v2(Bucket=BUCKET_NAME)
    
    # Check if the bucket contains any objects
    if 'Contents' in response:
        # Loop through all the objects in the bucket
        for obj in response['Contents']:
            # DO NOT CHECK if the object's key (file name) contains the audio_id
            # Delete the object from the bucket
            s3.delete_object(Bucket=BUCKET_NAME, Key=obj['Key'])
            print(f"Deleted object: {obj['Key']}")
    else:
        print("Bucket is empty")

    return {
        'statusCode': 200,
        'body': json.dumps('Operation completed successfully')
    }