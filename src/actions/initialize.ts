import {Action, ClientConfig} from "../models";
import {Tokens} from "../models/tokens";

/**
 * Starts the initialization process
 * @param id - action id
 * @param config
 */
export const initializeAction = (id: string, config: ClientConfig) => {
	config.iFrame.contentWindow.postMessage(
		new Action(config.clientId, "initialize", {
			id
		}),
		'*',
	);

	//will remove expired tokens before any authentication begins for sanity-sake
	Tokens.get();
};
