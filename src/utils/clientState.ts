import Base64 from "crypto-js/enc-base64";
import Utf8 from "crypto-js/enc-utf8";
import { ClientState } from "../models";
import {Logger} from "./logging";

/**
 * Prepares clientState to be submitted to the Component API by adding referrer from the browser and base64 encoding
 * @param {Object} clientState - a client supplied value that is returned with the response
 * @returns {string} base64 encoded string containing the clientState
 */
export const prepare = (clientState?: ClientState) : string => {
    const referrer = document.location.href;

    if (!clientState) {
        return encode({referrer});
    }

    if (typeof clientState === "string") {
        //if is a base64 string, we'll try to decode/parse. Otherwise, we ignore it
        clientState = isEncoded(clientState) ? decodeAndParse(<string>clientState) : { };
    } else if (typeof clientState !== "object") {
        clientState = {};
    }

    if (!clientState.hasOwnProperty("referrer")) {
        clientState.referrer = referrer;
    }
    return encode(clientState);
};

export const encode = (clientState: ClientState) => {
    const clientStateJson = JSON.stringify(clientState);
    const clientStateWords = Utf8.parse(clientStateJson);
    return Base64.stringify(clientStateWords);
};

/**
 * Decodes and parses clientState returned from Component API or Authorization
 * @param encodedClientState
 */
export const decodeAndParse = (encodedClientState: string) : ClientState | undefined  => {
    if (!encodedClientState)
        return undefined;

    try {
        if (typeof encodedClientState !== "string") {
            return <ClientState>encodedClientState;
        }

        if(isEncoded(encodedClientState)) {
            const clientStateWords = Base64.parse(encodedClientState);
            const clientStateJson = Utf8.stringify(clientStateWords);
            return JSON.parse(clientStateJson);
        }
    } catch (e) {
        Logger.warn("Unable to decode clientState", encodedClientState);
    }
    return {};
};

const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

export const isEncoded = (value: string) => {
    return value && base64regex.test(value);
};
