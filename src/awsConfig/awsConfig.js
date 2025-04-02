import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { S3Client } from "@aws-sdk/client-s3";

export const awsConfig = {
    region: "ap-northeast-2",
    bucketName: "comp3329-game-assets",
    identityPoolId: "ap-northeast-2:e7afd6e4-120e-4d32-b1df-b1c711582dd4"
};

export const getS3Client = () => {
    return new S3Client({
        region: awsConfig.region,
        credentials: fromCognitoIdentityPool({
            client: new CognitoIdentityClient({ region: awsConfig.region }),
            identityPoolId: awsConfig.identityPoolId,
        }),
    });
};