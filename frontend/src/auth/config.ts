import { Amplify } from "aws-amplify";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { sessionStorage } from "aws-amplify/utils";

export const authMode =
  import.meta.env.VITE_AUTH_MODE === "cognito" ? "cognito" : "demo";

export function configureAuth(): void {
  if (authMode !== "cognito") return;

  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;
  if (!userPoolId || !userPoolClientId) {
    throw new Error(
      "Faltan VITE_COGNITO_USER_POOL_ID y VITE_COGNITO_USER_POOL_CLIENT_ID.",
    );
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: { email: true },
        signUpVerificationMethod: "code",
        userAttributes: {
          email: { required: true },
        },
      },
    },
  });
  cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorage);
}
