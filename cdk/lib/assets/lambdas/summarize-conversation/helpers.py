import json

def retrieve_complete_transcription(output_bucket,output_key,new_content, type_of_audio, s3_client):
    # Check if the file already exists in the output bucket
    try:
        s3_client.head_object(Bucket=output_bucket, Key=output_key)
        # If it exists, read its content
        response = s3_client.get_object(Bucket=output_bucket, Key=output_key)
        existing_content = response['Body'].read().decode('utf-8')
        transcription = generate_prompt(new_content, type_of_audio, existing_content)
    except Exception as e:
        # If the file doesn't exist, use only new content
        transcription = generate_prompt(new_content,type_of_audio)
    return transcription



def generate_prompt(new_content, type_of_audio, existing_content=None):
    if existing_content is None:
            if type_of_audio == "dialogue":
                prompt = f"""
                Summarize a dialogue. The transcript of the 
                dialogue is as follows:

                {new_content}

    
                Write the summary in the same language as the data. Do not provide a preamble. \n\nAssistant:"""
            elif type_of_audio == "single_speech":
                prompt = f""" 
                Summarize a speech. The transcript of the speech is as follows:
    
                {new_content}
    
    
                Write the summary in the same language as the data. Do not provide a preamble. \n\nAssistant:"""
            else:
                raise ValueError("Invalid content_type. It should be 'dialogue' or 'single_speech'.")
    else:
        if type_of_audio == "dialogue":
            prompt = f""" 
            I need to summarize a dialogue. There is a pre-existing summary:

            {existing_content}

            And the new transcript of the dialogue is as follows:

            {new_content}


            Write one single summary for the whole dialogue in the same language as the data. 
            Do not provide a preamble. """
        elif type_of_audio == "single_speech":
            prompt = f"""
            I need to summarize a speech. There is a pre-existing summary:

            
            {existing_content}
            
            And the new transcript of the dialogue is as follows:
            {new_content}
                  


            Write one single summary for the whole speech in the same language as the data. 
            Do not provide a preamble."""
        else:
            raise ValueError("Invalid content_type. It should be 'dialogue' or 'single_speech'.")
    return prompt

    
def generate_summary(prompt, bedrock_runtime, selected_model):
    body = json.dumps({
        "max_tokens": 500,
        "messages": [{"role": "user", "content": prompt}
                    ,{"role": "assistant", "content": "The summary is:"}],
        "anthropic_version": "bedrock-2023-05-31"
    })
    
    response = bedrock_runtime.invoke_model(body=body, modelId= selected_model)

    summary = json.loads(response.get("body").read())    
    print(summary)
    return summary.get("content")[0]["text"]


def save_summary_to_s3(summary, output_bucket, output_key, s3_client):
    s3_client.put_object(
        Bucket=output_bucket,
        Key=output_key,
        Body=summary,
        ContentType='text/plain'
    )
