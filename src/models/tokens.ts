import { getLocalStorageWithExpiration, setLocalStorageWithExpiration, removeFromLocalStorage } from "../storage";
import { AUTH_ACCESS_STORAGE_KEY, AUTH_ID_STORAGE_KEY, AUTH_REFRESH_STORAGE_KEY } from "../const";
import { parseToken } from "../utils";

export const REFRESH_TOKEN_EXPIRATION_DAYS = 1; //TODO: Make configurable

export interface TokenCollection {
    accessToken: string;
    idToken: string;
    refreshToken: string;
}

export class Tokens implements TokenCollection {
    accessToken: string;
    idToken: string;
    refreshToken: string;

    constructor(tokens?: TokenCollection) {
        Object.assign(this, tokens);
        Object.freeze(this);
    }

    /**
     * Gets Authentication Tokens from local storage
     */
    static get(): Tokens | undefined {
        const refreshToken = getLocalStorageWithExpiration(AUTH_REFRESH_STORAGE_KEY);
        const accessToken = getLocalStorageWithExpiration(AUTH_ACCESS_STORAGE_KEY);
        const idToken = getLocalStorageWithExpiration(AUTH_ID_STORAGE_KEY);
        return refreshToken || accessToken || idToken
            ? new Tokens({
                  accessToken,
                  idToken,
                  refreshToken,
              })
            : undefined;
    }

    /**
     * Sets user's credentials to local storage
     */
    static set(authentication: Tokens) {
        const token = parseToken(authentication?.accessToken);
        if (!token) {
            return;
        }
        const expiration = new Date(token.exp * 1000);
        if (authentication.accessToken) {
            setLocalStorageWithExpiration(AUTH_ACCESS_STORAGE_KEY, authentication.accessToken, expiration);
        }
        if (authentication.idToken) {
            setLocalStorageWithExpiration(AUTH_ID_STORAGE_KEY, authentication.idToken, expiration);
        }
        if (authentication.refreshToken) {
            setLocalStorageWithExpiration(
                AUTH_REFRESH_STORAGE_KEY,
                authentication.refreshToken,
                60 * 60 * REFRESH_TOKEN_EXPIRATION_DAYS, //expire x-days
            );
        }
    }

    /**
     * Clears all Authentication in local storage
     */
    static clear() {
        removeFromLocalStorage(AUTH_ACCESS_STORAGE_KEY);
        removeFromLocalStorage(AUTH_ID_STORAGE_KEY);
        removeFromLocalStorage(AUTH_REFRESH_STORAGE_KEY);
    }
}
