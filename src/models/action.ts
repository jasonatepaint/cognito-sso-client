import { TokenCollection } from "./tokens";

export type ActionType = "authenticate" | "initialize" | "logout" | "redeemCode" | "refreshTokens";

export interface ActionDetails {
    id: string;
    clientState?: string;
    encodedClientState?: string;
    redirectUri?: string;
}

export interface AuthenticationActionDetails extends ActionDetails {
    redirectUnauthenticated: boolean;
    redirectionReturnUrl: string;
    authentication: TokenCollection;
}

export interface LogoutActionDetails extends AuthenticationActionDetails {
    clientOnlyLogout: boolean;
}

export interface RedeemCodeActionDetails extends ActionDetails {
    code: string;
    codeVerifier: string;
    clientId: string;
}

export type ActionDetailType =
    | ActionDetails
    | AuthenticationActionDetails
    | LogoutActionDetails
    | RedeemCodeActionDetails;

export interface Action {
    clientId: string;
    action: ActionType;
    details: ActionDetailType;
}
