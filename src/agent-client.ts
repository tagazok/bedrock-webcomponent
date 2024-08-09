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

        // if (response.stream === undefined) {
        //     throw new Error("Stream is undefined");
        // }

        // for await (const item of response.stream) {
        //     if (item.contentBlockDelta) {
        //         const text = item.contentBlockDelta.delta?.text;
        //         if (text) {
        //             yield text
        //         }
        //     }
        // }
        // return completion;
    }

    // async sendMessage(messages: any[]) {
    //     debugger;

    //     const command = new InvokeAgentCommand({
    //         agentId: this.config.bedrock.agent.agentId,
    //         agentAliasId: this.config.bedrock.agent.agentAliasId,
    //         sessionId: this.sessionId,
    //         inputText: messages[messages.length - 1].content[0].text
    //     });

    //     try {
    //         const response = await this.#bedrockClient.send(command);
    //         let completion = "";

    //         if (response.completion === undefined) {
    //             throw new Error("Completion is undefined");
    //         }

    //         for await (let chunkEvent of response.completion) {
    //             const chunk = chunkEvent.chunk;
    //             if (chunk) {
    //                 const decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
    //                 completion += decodedResponse;
    //             }
    //         }
    //         return completion
    //     } catch (error) {
    //         console.log(`ERROR: ${error}`);
    //         throw error;
    //     }
    // }
}