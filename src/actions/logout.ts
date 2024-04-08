import { Action, AuthenticationState, ClientConfig } from "../models";

/**
 * Logs out the current user
 * @param id - action id
 * @param config
 * @param state
 * @param clientOnlyLogout - Determines if the user is logged out of both the SSO and the client app, or just the client.
 * @param redirectToLogin indicates that the user should be redirected to a login page after logout
 * @param encodedClientState - encoded client state - will be returned in response
 */
export const logoutAction = (
    id: string,
    config: ClientConfig,
    state: AuthenticationState,
    clientOnlyLogout: boolean,
    redirectToLogin = true,
    encodedClientState?: string,
) => {
    redirectToLogin = redirectToLogin ?? true;
    state.clearAuthentication();

    config.iFrame.contentWindow.postMessage(<Action>{
        clientId: config.clientId,
        action: "logout",
        details: {
            id,
            redirectUnauthenticated: redirectToLogin,
            redirectUri: config.redirectUri,
            clientState: encodedClientState,
            clientOnlyLogout,
        }
    }, "*");
};
