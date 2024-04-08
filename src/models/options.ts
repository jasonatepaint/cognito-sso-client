import { LogLevel } from "../utils/logging";

export interface InitializeOptions {
    /**
     * Determines if the Activity Monitor is used to keep the user's tokens refreshed automatically while they are active.
     */
    autoRefresh?: boolean;

    logLevel?: LogLevel;
}

export interface AuthenticateOptions {
    /**
     * indicates the user should be redirected to the identity broker if not authenticated
     */
    redirect: boolean;
}

export interface LogoutOptions {
    /**
     * indicates whether the user is logged out of both SSO and the client app, or just the client.
     */
    clientOnly: boolean;
    /**
     * indicates the user should be redirected to the identity broker if not authenticated
     */
    redirect: boolean;
}
