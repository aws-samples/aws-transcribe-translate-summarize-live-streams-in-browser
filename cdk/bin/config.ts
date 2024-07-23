import { existsSync, readFileSync } from "fs";

export interface SystemConfig {
  prefix: string;
  aws_region: string;
  bucket_name: string;
  bedrock_region: string;
  bedrock_model_id: string;
}

export function getConfig(): SystemConfig {
  if (existsSync("./bin/config.json")) {
    return JSON.parse(readFileSync("./bin/config.json").toString("utf8"));
  }

  // Default config
  return {
    prefix: "aaa123", // TODO: random
    aws_region: "us-west-2",
    bucket_name: "summarization-test",
    bedrock_region: "us-west-2",
    bedrock_model_id: "anthropic.claude-3-sonnet-20240229-v1:0"
  };
}

export const config: SystemConfig = getConfig();
