import { CognitoIdentityClient, GetIdCommand, GetOpenIdTokenCommand } from "@aws-sdk/client-cognito-identity";
import { STSClient, AssumeRoleWithWebIdentityCommand } from "@aws-sdk/client-sts";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { AuthConfig } from "./models";

export async function awsCredentialsForAnonymousUser(authConfig: AuthConfig) {
    // 1. Obtain a Cognito Identity Pool OpenId token.
    const cognitoClient = new CognitoIdentityClient({ region: authConfig.region });

    const identity = await cognitoClient.send(new GetIdCommand({ IdentityPoolId: authConfig.identityPoolId }));
    const token = await cognitoClient.send(new GetOpenIdTokenCommand({ IdentityId: identity.IdentityId }))

    // 2. exchange the Cognito OpenId token for an AWS access key and secret key.
    // This is done by assuming a role that defines the permission on these tokens
    const stsClient = new STSClient({ region: authConfig.region });
    const credentials = await stsClient.send(new AssumeRoleWithWebIdentityCommand({
        RoleArn: authConfig.anonymous?.roleArn,
        RoleSessionName: 'BedrockEmbedChat',
        WebIdentityToken: token.Token
    }));

    return {
        accessKeyId: credentials.Credentials?.AccessKeyId || "",
        secretAccessKey: credentials.Credentials?.SecretAccessKey || "",
        sessionToken: credentials.Credentials?.SessionToken || "",
        expiration: credentials.Credentials?.Expiration || new Date()
    };
}

export async function awsCredentialsForAuthCognitoUser(authConfig: AuthConfig) {
    const userId = localStorage.getItem(`CognitoIdentityServiceProvider.${authConfig.cognito?.userPoolId}.LastAuthUser`);
    const idToken = localStorage.getItem(`CognitoIdentityServiceProvider.${authConfig.cognito?.userPoolId}.${userId}.idToken`);

    console.log(`idToken: ${idToken}`);
    const decodedToken = JSON.parse(atob(idToken!.split('.')[1]));
    const issuer = decodedToken.iss;
    console.log(`issuer: ${issuer}`);

    const providerName = issuer.replace("https://", "");

    const credentials = fromCognitoIdentityPool({
      identityPoolId: authConfig.identityPoolId,
      logins: {
        [providerName]: idToken,
      } as { [key: string]: string },
      clientConfig: { region: authConfig.region },
    });

    return credentials;
  }

