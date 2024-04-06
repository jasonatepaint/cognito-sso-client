import {createCallbackId, isTemporaryCallback, makeCallbacks} from "../../src/utils/callbacks";
import {ResponseDetails, ResponseMessage} from "../../src";

describe('Callback Ids', () => {
	test('is temporary callback', async () => {
		expect(isTemporaryCallback(createCallbackId("action1"))).toBeTruthy();
		expect(isTemporaryCallback(createCallbackId("action2"))).toBeTruthy();
		expect(isTemporaryCallback("action")).toBeFalsy();
	});
});

describe('Make Callbacks', () => {
	let actionId: string;
	const message= <ResponseMessage>{
		response: "checkAuthentication",
		details: <ResponseDetails>{
			id: "details",
			success: true
		}
	};
	beforeEach(function () {
		actionId = createCallbackId("checkAuthentication");
	});

	test('no temporary callbacks', async () => {
		const callbacks = {
			one: jest.fn(),
			two: jest.fn(),
		};
		makeCallbacks(actionId, callbacks, message);
		expect(callbacks.one).toHaveBeenCalledTimes(1);
		expect(callbacks.one).toHaveBeenCalledWith(message);
		expect(callbacks.two).toHaveBeenCalledTimes(1);
		expect(callbacks.two).toHaveBeenCalledWith(message);
	});

	test('has temporary callback', async () => {
		const tempCallback = jest.fn();
		const callbacks = {
			one: jest.fn()
		};
		callbacks[actionId] = tempCallback;

		makeCallbacks(actionId, callbacks, message);
		expect(callbacks.one).toHaveBeenCalledTimes(1);
		expect(callbacks.one).toHaveBeenCalledWith(message);
		expect(tempCallback).toHaveBeenCalledTimes(1);
		expect(tempCallback).toHaveBeenCalledWith(message);
		expect(callbacks[actionId]).toBeUndefined(); //should have been removed
	});

	test('multiple temporary callbacks', async () => {
		const tempCallback = jest.fn();
		const callbacks = {
			one: jest.fn()
		};
		callbacks[actionId] = tempCallback;

		//add a second callback that wasn't called explicitly
		const actionId2 = createCallbackId("refreshTokens");
		callbacks[actionId2] = jest.fn();

		makeCallbacks(actionId, callbacks, message);
		expect(callbacks.one).toHaveBeenCalledTimes(1);
		expect(callbacks.one).toHaveBeenCalledWith(message);
		expect(tempCallback).toHaveBeenCalledTimes(1);
		expect(tempCallback).toHaveBeenCalledWith(message);
		expect(callbacks[actionId]).toBeUndefined(); //should have been removed

		//Should not have been called.
		expect(callbacks[actionId2]).toHaveBeenCalledTimes(0);
	});

	test('handles a non-function callback', async () => {
		const callbacks = {};
		callbacks["a"] = jest.fn();
		callbacks["b"] = {}; //not a function
		callbacks["c"] = undefined;

		makeCallbacks(actionId, callbacks, message);

		expect(callbacks["a"]).toHaveBeenCalledTimes(1);
		expect(callbacks["a"]).toHaveBeenCalledWith(message);
	});

	test('handles a function that throws error', async () => {
		const callbacks = {};
		let called = false;
		callbacks["a"] = () => {
			called = true;
			throw new Error();
		};

		makeCallbacks(actionId, callbacks, message);

		expect(called).toBeTruthy();
	});
});
