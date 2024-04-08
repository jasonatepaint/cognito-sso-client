import { launchUri } from "../utils/browser";
import { setLocalStorageWithExpiration } from "../storage";
import { CODE_VERIFIER_STORAGE_KEY, QS_STATE } from "../const";
import { generateRandom, generateChallenge, buildUrlFromConfig } from "../utils";
import { ClientConfig } from "../models";

/**
 * Initiates the Authorization Code Flow process for the user
 * @param config
 * @param encodedClientState - encoded client state - will be returned in response
 */
export const initiateCodeFlowAction = (config: ClientConfig, encodedClientState?: string) => {
    const codeVerifier = generateRandom(128);
    setLocalStorageWithExpiration(CODE_VERIFIER_STORAGE_KEY, codeVerifier, 900);
    const codeChallenge = generateChallenge(codeVerifier);

    const qsParams = {
        codeChallenge,
        ...(encodedClientState ? { [QS_STATE]: encodedClientState } : {}),
    };

    launchUri(buildUrlFromConfig(config, undefined, qsParams));
};