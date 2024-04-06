import {getLocalStorageWithExpiration, removeFromLocalStorage} from "../storage";
import {CODE_VERIFIER_STORAGE_KEY} from "../const";
import {Action, AuthenticationState, ClientConfig} from "../models";
import {Logger} from "../utils/logging";

/**
 * Exchanges an authentication code for authentication tokens
 * @param id - action id
 * @param config
 * @param state
 * @param code - authentication code
 * @param encodedClientState - encoded client state - will be returned in response
 */
export const redeemCodeAction = (id: string, config: ClientConfig, state: AuthenticationState, code: string, encodedClientState?: string) => {
	const codeVerifier = getLocalStorageWithExpiration(CODE_VERIFIER_STORAGE_KEY);
	Logger.info('redeeming code', code);
	Logger.debug("Code Verifier", codeVerifier);
	config.iFrame.contentWindow.postMessage(
		new Action(config.clientId, "redeemCode", {
			id,
			code,
			codeVerifier,
			redirectUri: config.redirectUri,
			clientId: config.clientId,
			clientState: encodedClientState,
		}),
		'*',
	);
	removeFromLocalStorage(CODE_VERIFIER_STORAGE_KEY);
};
