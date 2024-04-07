import { ActivityMonitor, getTestContext, resetTests } from "../src/activityMonitor";
import dayjs from "dayjs";
import { DEFAULT_INACTIVE_MINUTES } from "../src/const";

describe("Activity Watcher", () => {
    let callbackFunctions: any;
    let onActiveIntervalCallback: jest.Mock;
    let activityEvents: string[];
    beforeEach(function () {
        jest.clearAllMocks();
        jest.clearAllTimers();
        resetTests();

        jest.spyOn(global, "clearInterval");
        jest.spyOn(global, "setInterval");
        jest.spyOn(document, "addEventListener");

        onActiveIntervalCallback = jest.fn();
        callbackFunctions = {
            onActiveIntervalCallback,
        };

        activityEvents = getTestContext().activityEvents;
    });

    test("initializes once", async () => {
        ActivityMonitor.init(callbackFunctions);
        ActivityMonitor.init(callbackFunctions);
        ActivityMonitor.init(callbackFunctions);

        expect(document.addEventListener).toHaveBeenCalledTimes(activityEvents.length);
        activityEvents.forEach((eventName) => {
            expect(document.addEventListener).toHaveBeenCalledWith(eventName, expect.any(Function), true);
        });
    });

    test("start timer", async () => {
        jest.clearAllMocks();
        ActivityMonitor.init(callbackFunctions);

        ActivityMonitor.start();
        const { intervalId } = getTestContext();
        expect(setInterval).toHaveBeenCalledWith(ActivityMonitor.activityFn, ActivityMonitor.pollInterval * 1000);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(intervalId).toBeDefined();
        expect(clearInterval).toHaveBeenCalledTimes(0);

        //Start again -- should clear interval
        jest.clearAllMocks();
        ActivityMonitor.start();
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenCalledWith(ActivityMonitor.activityFn, ActivityMonitor.pollInterval * 1000);
        expect(clearInterval).toHaveBeenCalledTimes(1);
        expect(clearInterval).toHaveBeenCalledWith(intervalId);
    });

    test("stop timer", async () => {
        ActivityMonitor.init(callbackFunctions);
        ActivityMonitor.start();
        let { intervalId } = getTestContext();
        expect(intervalId).toBeDefined();
        expect(ActivityMonitor.isActive).toBeFalsy();
        expect(ActivityMonitor.initialized).toBeTruthy();

        ActivityMonitor.stop();
        expect(clearInterval).toHaveBeenCalledWith(intervalId);

        expect(getTestContext().intervalId).toBeUndefined();
        expect(ActivityMonitor.isActive).toBeFalsy();
        expect(ActivityMonitor.initialized).toBeTruthy();
    });

    describe("Activity Function", () => {
        beforeEach(function () {
            ActivityMonitor.init(callbackFunctions);
        });

        test("not active", async () => {
            const date = new Date();
            const secs = DEFAULT_INACTIVE_MINUTES * 60 + 1;
            getTestContext().setLastActivityDate(dayjs(date).subtract(secs, "second").toDate());
            ActivityMonitor.activityFn();
            expect(onActiveIntervalCallback).toHaveBeenCalledTimes(0);
            expect(ActivityMonitor.isActive).toBeFalsy();

            //no inactive callback
            jest.clearAllMocks();
            resetTests();
            const fns = {
                onActiveIntervalCallback,
            };
            ActivityMonitor.init(fns);
            ActivityMonitor.activityFn();
            expect(onActiveIntervalCallback).toHaveBeenCalledTimes(0);
        });

        test("active", async () => {
            getTestContext().setLastActivityDate(new Date());
            ActivityMonitor.activityFn();
            expect(onActiveIntervalCallback).toHaveBeenCalledTimes(1);
            expect(ActivityMonitor.isActive).toBeTruthy();

            //no inactive callback
            jest.clearAllMocks();
            resetTests();
            ActivityMonitor.init({});
            ActivityMonitor.activityFn();
            expect(onActiveIntervalCallback).toHaveBeenCalledTimes(0);
            expect(ActivityMonitor.isActive).toBeTruthy();
        });
    });
});
