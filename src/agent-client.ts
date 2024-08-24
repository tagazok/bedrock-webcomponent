/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    BedrockAgentRuntimeClient,
    InvokeAgentCommand
} from "@aws-sdk/client-bedrock-agent-runtime";
import { ChatConfig } from "./models";

export class AgentClient {
    #bedrockClient: BedrockAgentRuntimeClient;
    config: ChatConfig;
    sessionId: string;

    constructor(config: ChatConfig, credentials: any) {
        this.config = config;

        this.#bedrockClient = new BedrockAgentRuntimeClient({
            region: config.bedrock.region,
            credentials: credentials
        });
        this.sessionId = Date.now() + "";
    }

    async *sendMessage(messages: any[]) {
        const modelId = this.config.bedrock.modelId || "anthropic.claude-3-sonnet-20240229-v1:0";

        const command = new InvokeAgentCommand({
            agentId: this.config.bedrock.agent.agentId,
            agentAliasId: this.config.bedrock.agent.agentAliasId,
            sessionId: this.sessionId,
            inputText: messages[messages.length - 1].content[0].text
        });

        const response = await this.#bedrockClient.send(command);
        
        for await (const chunkEvent of response.completion) {
            const chunk = chunkEvent.chunk;
            const decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
            yield decodedResponse;
        }
    }
}