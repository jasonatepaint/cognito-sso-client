import { authorizeAction } from "./actions";
import { handleAuthenticationUpdated } from "./eventHandlers";
import { makeCallbacks } from "./utils/callbacks";
import { getValueFromQueryString } from "./utils/url";
import { QS_STATE } from "./const";
import {AuthenticationState, ClientConfig, ResponseMessage} from "./models";
import {Logger} from "./utils/logging";

/**
 * handles a postMessage event from the SSO Identity Broker
 */
export const handleMessage = (message: MessageEvent<ResponseMessage>, config: ClientConfig, state: AuthenticationState) => {
    const responseMessage = message.data;
    Logger.debug("Message Received", JSON.stringify(responseMessage, null, 2));

    // handle invalid communication
    if (!responseMessage?.response) {
        return;
    }

    const {
        id,
        success,
        isAuthenticated,
        authentication,
        user
    } = responseMessage.details;

    if (user) {
        Object.freeze(user);
        state.setUser(user);
    }

    // This clientState was encoded outbound by this client. The SSO Broker will pass back the encoded clientState (untouched).
    // If it exists, we'll decode it from the QS first, because it was a redirect. If we don't have state on the QS, we'll
    // search for it in the response
    const qsState = getValueFromQueryString(QS_STATE);
    const encodedClientState =  qsState || responseMessage.details.clientState;
    if(qsState) {
        responseMessage.details.clientState = encodedClientState;
    }

    switch (responseMessage.response) {
        case "initialized":
            makeCallbacks(id, config.callbacks, responseMessage);
            break;
        case "checkAuthentication":
        case "redeemCode":
        case "refreshTokens":
            if (success && isAuthenticated && authentication) {
                handleAuthenticationUpdated(authentication);
            }
            makeCallbacks(id, config.callbacks, responseMessage);
            break;
        case "logout":
            if (success) {
                state.clearAuthentication();
            }
            makeCallbacks(id, config.callbacks, responseMessage);
            break;
        case "redirectToLogin":
            authorizeAction(config, encodedClientState);
            break;
        default:
            Logger.debug('Invalid message response received', responseMessage);
            break;
    }
};
