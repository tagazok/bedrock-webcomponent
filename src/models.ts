export type WebExperience = {
    title: string;
    subtitle: string;
    welcomeMessage: string;
}

export type CognitoAuthConfig = {
    userPoolId: string;
}
export type AnonymousAuthConfig = {
    roleArn: string;
}

export type UIIconsConfig = {
    user?: string,
    assistant?: string
}

export type UIConfig = {
    // floatingWindow: boolean;
    // logoUrl?: string;
    // containerId?: string;
    webExperience?: WebExperience;
    icons?: UIIconsConfig
}

export type BedrockAgentConfig = {
    agentId: string;
    agentAliasId: string;
}

export type BedrockConfig = {
    region: string;
    modelId?: string;
    agent?: BedrockAgentConfig;
}
export type AuthConfig = {
    region: string;
    identityPoolId: string;
    cognito?: CognitoAuthConfig
    anonymous?: AnonymousAuthConfig;
}
export type ChatConfig = {
    auth: AuthConfig;
    bedrock: BedrockConfig;
    ui: UIConfig;
    context?: string;
}