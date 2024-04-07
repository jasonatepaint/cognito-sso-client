import { DEFAULT_INACTIVE_MINUTES, POLL_INTERVAL_ACTIVITY_SECONDS } from "./const";

/**
 * An array of DOM events that should be interpreted as user activity.
 */
const activityEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

type ActivityCallbackFn = () => void;

export type ActivityCallbackFunctions = {
    onActiveIntervalCallback?: ActivityCallbackFn;
};

let initialized = false;
let lastActivityDate = Date.now();
let isActive = false;
let intervalId: NodeJS.Timeout;
let callbackFunctions: ActivityCallbackFunctions;

export class ActivityMonitor {
    static get initialized() {
        return initialized;
    }

    static get isActive() {
        return isActive;
    }

    static get pollInterval() {
        return POLL_INTERVAL_ACTIVITY_SECONDS;
    }

    static init(callbackFns: ActivityCallbackFunctions) {
        if (initialized) return;

        callbackFunctions = callbackFns;

        //add these events to the document.
        //register the activity function as the listener parameter.
        activityEvents.forEach(function (eventName) {
            document.addEventListener(
                eventName,
                () => {
                    /* istanbul ignore next */
                    lastActivityDate = Date.now();
                },
                true,
            );
        });

        initialized = true;
    }

    /**
     * Starts the activity timer
     */
    static start() {
        if (intervalId) {
            ActivityMonitor.stop();
        }
        intervalId = setInterval(ActivityMonitor.activityFn, POLL_INTERVAL_ACTIVITY_SECONDS * 1000);
    }

    static stop() {
        clearInterval(intervalId);
        intervalId = undefined;
        isActive = false;
    }

    /***
     * Evaluates the user's Activity status
     */
    static activityFn() {
        const { onActiveIntervalCallback } = callbackFunctions;
        const secondsSinceLastActivity = Math.round((Date.now() - lastActivityDate) / 1000);
        isActive = secondsSinceLastActivity < DEFAULT_INACTIVE_MINUTES * 60;

        //User is active
        if (onActiveIntervalCallback && isActive) {
            onActiveIntervalCallback();
        }
    }
}

export const resetTests = () => {
    initialized = false;
    ActivityMonitor.stop();
};

export const getTestContext = () => {
    return {
        activityEvents,
        intervalId,
        setLastActivityDate: function (date) {
            lastActivityDate = date;
        },
    };
};
