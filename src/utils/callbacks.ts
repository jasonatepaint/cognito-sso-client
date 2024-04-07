import { FunctionCallbacks, ResponseMessage } from "../models/response";
import { Logger } from "./logging";

export const ACTION_CALLBACK_PREFIX = "action:";

export const createCallbackId = (action: string): string => {
    return `${ACTION_CALLBACK_PREFIX}${action}-${Date.now()}`;
};

export const isTemporaryCallback = (id: string): boolean => {
    return id?.startsWith(ACTION_CALLBACK_PREFIX);
};

/**
 * Takes a callback object (with keys) and attempts to call each callback w/the message
 * @param actionId - The unique action that triggered this event
 * @param callbacks - A callback object with 1 or more callbacks defined (by key)
 * @param message - The message object to send
 */
export const makeCallbacks = (actionId: string, callbacks: FunctionCallbacks, message: ResponseMessage) => {
    if (!callbacks) return;
    Object.keys(callbacks).forEach((id) => {
        let callback: (message: ResponseMessage) => void;
        let isTemporary = false;

        // if the callback id is a temporary command callback, we should only call the callback
        // if the IDs match. This assures our command callbacks are only called by the command that initiated it.
        if (isTemporaryCallback(id)) {
            if (actionId === id) {
                isTemporary = true;
                callback = callbacks[id];
            }
        } else {
            callback = callbacks[id];
        }
        try {
            if (typeof callback === "function") {
                callback(message);
            }

            //remove the temporary callback so we only call it once
            if (isTemporary) {
                delete callbacks[id];
                Logger.debug(`unregistered callback: ${id}`, Object.keys(callbacks));
            }
        } catch (e) {
            Logger.warn(`Failed to call callback w/id: ${id}`, e);
        }
    });
};
