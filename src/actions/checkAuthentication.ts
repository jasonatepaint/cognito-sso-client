import { Action, AuthenticationState, ClientConfig } from "../models";
import { getValueFromQueryString } from "../utils/url";
import { QS_AUTH_CODE } from "../const";
import { redeemCodeAction } from "./redeemCode";
import { authorizeAction } from "./authorize";
import { makeCallbacks } from "../utils/callbacks";
import { CheckAuthenticationOptions } from "../models/options";
import { Logger } from "../utils/logging";

/**
 * checks if the current user is authenticated by querying  api
 * - there are 3 paths:
 *      1) A new auth code is in query string - redeems code for tokens
 *      2) Auth tokens exist - calls component API to verify tokens are still valid
 *      3) Auth tokens and code do not exist - user is not authenticated and is optionally redirected to login page
 * @param id - command ID
 * @param config
 * @param state
 * @param options
 * @param encodedClientState - encoded client state - will be returned in response
 */
export const checkAuthenticationAction = (
    id: string,
    config: ClientConfig,
    state: AuthenticationState,
    options: CheckAuthenticationOptions,
    encodedClientState?: string,
) => {
    options.redirect = options.redirect ?? true;
    const { redirectUri, ssoUrl, clientId } = config;

    //1. attempt code exchange
    const code = getValueFromQueryString(QS_AUTH_CODE);
    if (code) {
        return redeemCodeAction(id, config, state, code, encodedClientState);
    }

    //2. Tokens exist
    if (state.authentication?.refreshToken) {
        return config.iFrame.contentWindow.postMessage(<Action>{
            clientId,
            action: "checkAuthentication",
            details: {
                id,
                redirectUnauthenticated: options.redirect,
                redirectionReturnUrl: ssoUrl,
                authentication: state.authentication,
                redirectUri,
                clientState: encodedClientState,
            }
        }, "*");
    }

    //3. Unauthenticated
    Logger.debug("unauthenticated");
    if (options.redirect) {
        return authorizeAction(config, encodedClientState);
    }

    makeCallbacks(id, config.callbacks, {
        response: "checkAuthentication",
        details: {
            id,
            isAuthenticated: false,
            success: true,
            //this is a response, so we need to decode state
            clientState: encodedClientState,
        },
    });
};
