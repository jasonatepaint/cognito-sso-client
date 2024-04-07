import { Action, AuthenticationState, ClientConfig } from "../models";

/**
 * Refreshes client tokens
 * @param id - action id
 * @param config
 * @param state
 * @param encodedClientState - encoded client state - will be returned in response
 */
export const refreshTokensAction = (
    id: string,
    config: ClientConfig,
    state: AuthenticationState,
    encodedClientState?: string,
) => {
    config.iFrame.contentWindow.postMessage(
        new Action(config.clientId, "refreshTokens", {
            id,
            authentication: state.authentication,
            clientState: encodedClientState,
        }),
        "*",
    );
};
