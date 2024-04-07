import sha256 from "crypto-js/sha256";
import { base64URL, bufferToString } from "./crypto";
import { Logger } from "./logging";

/* istanbul ignore next */
export const generateChallenge = (codeVerifier: string) => {
    return base64URL(<any>sha256(codeVerifier));
};

/* istanbul ignore next */
export const generateRandom = (size: number) => {
    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const buffer = new Uint8Array(size);
    if (typeof window !== "undefined" && !!window.crypto) {
        window.crypto.getRandomValues(buffer);
    } else {
        for (let i = 0; i < size; i += 1) {
            buffer[i] = (Math.random() * CHARSET.length) | 0;
        }
    }
    return bufferToString(buffer);
};

/**
 * Parses a JWT token
 * @param {string} token
 */
export const parseToken = (token: string) => {
    if (!token) return;

    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url?.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            window
                .atob(base64)
                .split("")
                .map(function (c) {
                    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join(""),
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        Logger.error("Failed to parse token", e);
    }
};
