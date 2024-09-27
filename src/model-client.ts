/* eslint-disable @typescript-eslint/no-explicit-any */
import { BedrockRuntimeClient, ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { ChatConfig } from "./models";

export class ModelClient {
    #bedrockClient: BedrockRuntimeClient
    config: ChatConfig;

    constructor(config: ChatConfig, credentials: any) {
        this.config = config;

        this.#bedrockClient = new BedrockRuntimeClient({
            credentials: credentials,
            region: this.config.bedrock.region
        });
    }

    async *sendMessage(messages: any[]) {
        const modelId = this.config.bedrock.modelId;

        const command = new ConverseStreamCommand({
            modelId: modelId,
            messages: messages,
            inferenceConfig: this.config.bedrock.inferenceConfig,
            toolConfig: this.config.bedrock.toolConfig
        });

        const response = await this.#bedrockClient.send(command);

        if (response.stream === undefined) {
            throw new Error("Stream is undefined");
        }

        for await (const chunk of response.stream) {
            if (chunk.contentBlockDelta) {
                const text = chunk.contentBlockDelta.delta?.text;
                if (text) {
                    yield text
                }
            }
        }
    }
}