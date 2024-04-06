import { handleMessage} from "../src/messageHandler";
import { parseToken } from "../src/utils";
import { getValueFromQueryString } from "../src/utils/url";
import {defaultAuthentication, defaultConfig, defaultUser} from "./data";
import {
	authorizeAction
} from "../src/actions";
import {AuthenticationState, ClientConfig, ResponseMessage, User} from "../src/models";
import {decodeAndParse, encode} from "../src/utils/clientState";
import {Tokens} from "../src/models/tokens";
import { handleAuthenticationUpdated } from "../src/eventHandlers";
import { makeCallbacks } from "../src/utils/callbacks";
import { ActivityMonitor } from "../src/activityMonitor";

jest.mock("../src/actions/authorize");
jest.mock("../src/actions/checkAuthentication");
jest.mock("../src/utils/callbacks");
jest.mock("../src/utils/tokens");
jest.mock("../src/utils/browser");
jest.mock("../src/utils/url");
jest.mock("../src/storage");
jest.mock("../src/utils/clientState");
jest.mock("../src/eventHandlers");
jest.mock("../src/activityMonitor");

let config: ClientConfig, state: AuthenticationState;
let message: MessageEvent<ResponseMessage>;
let authentication: Tokens;
let user: User;
let accessJWT: any;
let url: string;
let callback;
let actionId;

const mockParseToken = parseToken as jest.Mock;
const mockGetValueFromQueryString = getValueFromQueryString as jest.Mock;
const mockDecodeAndParse = decodeAndParse as jest.Mock;
const mockEncode = encode as jest.Mock;

const referrer = "http://domain.referrer.com";
const encodedClientState = "eyJyZWZlcnJlciI6Imh0dHA6Ly9kb21haW4ucmVmZXJyZXIuY29tIn0=";
const decodedClientState = { referrer };

const changePropTest = (object, prop) => {
	let error;
	try {
		object[prop] = "nope";
	} catch (e) {
		error = e;
	}
	expect(error).toBeDefined();
}

beforeEach(() => {
	jest.clearAllMocks();

	accessJWT = { exp: new Date().getTime() };
	authentication = defaultAuthentication();
	user = defaultUser();
	config = defaultConfig();
	state = new AuthenticationState();
	url = "http://some.domain.com";

	callback = jest.fn();

	// @ts-ignore
	jsdom.reconfigure({
		url
	});

	actionId = `action:refreshToken-${Date.now()}`;
	message = <MessageEvent<ResponseMessage>>{
		data: {
			response: "checkAuthentication",
			details: {
				id: actionId,
				success: true,
				isAuthenticated: true,
				user,
				authentication,
				clientState: encodedClientState
			}
		}
	};

	Object.defineProperty(document, 'referrer', { value: referrer });

	//util mocks
	mockParseToken.mockReturnValue(accessJWT);

	//url mocks
	mockGetValueFromQueryString.mockReturnValue(undefined);

	mockDecodeAndParse.mockReturnValue(decodedClientState);
	mockEncode.mockReturnValue(encodedClientState);

	jest.spyOn(Tokens, "get").mockReturnValue(authentication);
	jest.spyOn(Tokens, "set").mockReturnValue();
	jest.spyOn(Tokens, "clear").mockReturnValue();
});

describe('Handle Message', () => {
	test('sets user', async () => {
		handleMessage(message, config, state);

		expect(state.user).toEqual(user);
		changePropTest(state.user, "firstName"); //properties on user are frozen
		expect(config.options).toEqual(defaultConfig().options);
		expect(ActivityMonitor.start).toHaveBeenCalledTimes(0);
	});

	test('no response', async () => {
		delete message.data.response;
		handleMessage(message, config, state);

		//callbacks
		expect(callback).not.toHaveBeenCalled();
		expect(handleAuthenticationUpdated).toHaveBeenCalledTimes(0);
	});

	test('invalid response', async () => {
		// @ts-ignore
		message.data.response = "invalid";
		handleMessage(message, config, state);

		//callbacks
		expect(callback).not.toHaveBeenCalled();
		expect(handleAuthenticationUpdated).toHaveBeenCalledTimes(0);
	});

	test('handles missing user', async () => {
		delete message.data.details.user;
		handleMessage(message, config, state);

		expect(state.user).toBeUndefined();
		expect(config.options).toEqual(defaultConfig().options);
	});

	// test('sets clientState from response', async () => {
	// 	mockGetValueFromQueryString.mockReturnValue(undefined);
	//
	// 	handleMessage(message, config, state);
	// 	expect(encode).toHaveBeenCalledWith(message.data.details.clientState);
	// 	expect(decodeAndParse).toHaveBeenCalledTimes(0);
	// });
	//
	// test('sets clientState from querystring', async () => {
	// 	message.data.details.clientState = "thisHasExistingSTATE";
	// 	const encoded = "blahblahblah";
	// 	const decoded = { referrer: "https://diff.com", stuff: true };
	// 	mockGetValueFromQueryString.mockReturnValue(encoded);
	// 	mockDecodeAndParse.mockReturnValue(decoded);
	//
	// 	handleMessage(message, config, state);
	//
	// 	//We had state on both, but we should have preferred the qs value, if available
	// 	expect(decodeAndParse).toHaveBeenCalledWith(encoded);
	// 	expect(encode).toHaveBeenCalledTimes(0);
	// });

	test('no clientState', async () => {
		delete message.data.details.clientState;
		mockGetValueFromQueryString.mockReturnValue(undefined);

		handleMessage(message, config, state);
		expect(decodeAndParse).toHaveBeenCalledTimes(0);
	});

	test('no callback defined', async () => {
		handleMessage(message, config, state);
		expect(handleAuthenticationUpdated).toHaveBeenCalledWith(authentication);
	});
});

describe('initialized response', () => {
	beforeEach(function () {
		message.data.response = "initialized";
	});

	test('success', async () => {
		handleMessage(message, config, state);

		expect(makeCallbacks).toHaveBeenCalledWith(actionId, config.callbacks, message.data);
		expect(handleAuthenticationUpdated).toHaveBeenCalledTimes(0);
	});
});

describe('check authentication response', () => {
	beforeEach(function () {
		message.data.response = "checkAuthentication";
	});

	test('success', async () => {
		handleMessage(message, config, state);

		expect(handleAuthenticationUpdated).toHaveBeenCalledWith(authentication);
		expect(makeCallbacks).toHaveBeenCalledWith(actionId, config.callbacks, message.data)
	});

	test('not authenticated', async () => {
		message.data.details.isAuthenticated = false;
		handleMessage(message, config, state);

		expect(handleAuthenticationUpdated).toHaveBeenCalledTimes(0);
		expect(makeCallbacks).toHaveBeenCalledWith(actionId, config.callbacks, message.data)
	});

	test('not successful', async () => {
		message.data.details.success = false;
		handleMessage(message, config, state);

		//message.data.clientState = decodedClientState;

		expect(handleAuthenticationUpdated).toHaveBeenCalledTimes(0);
		expect(makeCallbacks).toHaveBeenCalledWith(actionId, config.callbacks, message.data)
	});
});

describe('redeem code response', () => {
	beforeEach(function () {
		message.data.response = "redeemCode";
	});

	test('success', async () => {
		handleMessage(message, config, state);

		expect(handleAuthenticationUpdated).toHaveBeenCalledWith(authentication);
		expect(makeCallbacks).toHaveBeenCalledWith(actionId, config.callbacks, message.data)
	});

	test('not authenticated', async () => {
		message.data.details.isAuthenticated = false;
		handleMessage(message, config, state);

		expect(handleAuthenticationUpdated).toHaveBeenCalledTimes(0);
		expect(makeCallbacks).toHaveBeenCalledWith(actionId, config.callbacks, message.data)
	});

	test('not successful', async () => {
		message.data.details.success = false;
		handleMessage(message, config, state);

		expect(handleAuthenticationUpdated).toHaveBeenCalledTimes(0);
		expect(makeCallbacks).toHaveBeenCalledWith(actionId, config.callbacks, message.data)
	});
});

describe('redirect to login response', () => {
	beforeEach(function () {
		message.data.response = "redirectToLogin";
		message.data.details = {
			success: true,
			clientState: encodedClientState
		};
	});

	test('as expected', async () => {
		handleMessage(message, config, state);

		expect(handleAuthenticationUpdated).toHaveBeenCalledTimes(0);
		expect(authorizeAction).toHaveBeenCalledWith(config, encodedClientState);
		expect(callback).toHaveBeenCalledTimes(0);
	});
});

describe('refresh tokens response', () => {
	beforeEach(function () {
		message.data.response = "refreshTokens";
	});

	test('success', async () => {
		handleMessage(message, config, state);

		expect(handleAuthenticationUpdated).toHaveBeenCalledWith(authentication);
		expect(makeCallbacks).toHaveBeenCalledWith(actionId, config.callbacks, message.data)
	});

	test('not authenticated', async () => {
		message.data.details.isAuthenticated = false;
		handleMessage(message, config, state);

		expect(handleAuthenticationUpdated).toHaveBeenCalledTimes(0);
		expect(makeCallbacks).toHaveBeenCalledWith(actionId, config.callbacks, message.data)
	});

	test('not successful', async () => {
		message.data.details.success = false;
		handleMessage(message, config, state);

		expect(handleAuthenticationUpdated).toHaveBeenCalledTimes(0);
		expect(makeCallbacks).toHaveBeenCalledWith(actionId, config.callbacks, message.data)
	});
});

describe('logout response', () => {
	beforeEach(function () {
		message.data.response = "logout";
		message.data.details.isAuthenticated = false;
		// @ts-ignore
		delete message.data.response.authentication;
	});

	test('success', async () => {
		handleMessage(message, config, state);

		expect(handleAuthenticationUpdated).toHaveBeenCalledTimes(0);
		expect(Tokens.clear).toHaveBeenCalled();
		expect(state.user).toBeUndefined();
		expect(makeCallbacks).toHaveBeenCalledWith(actionId, config.callbacks, message.data)
	});

	test('not successful', async () => {
		message.data.details.success = false;
		handleMessage(message, config, state);

		expect(state.authentication).toBeDefined();
		expect(state.user).toBeDefined();

		expect(handleAuthenticationUpdated).toHaveBeenCalledTimes(0);
		expect(Tokens.clear).toHaveBeenCalledTimes(0);

		expect(makeCallbacks).toHaveBeenCalledWith(actionId, config.callbacks, message.data)
	});
});
