import {
	handleAuthenticationUpdated
} from "../src/eventHandlers";
import {removeQueryStringParam} from "../src/utils/url";
import {defaultAuthentication} from "./data";
import {QS_AUTH_CODE, QS_STATE} from "../src/const";
import {Tokens} from "../src/models/tokens";

jest.mock("../src/utils/url");
jest.mock("../src/models/tokens");

const mockAuthenticationTokensGet = Tokens.get as jest.Mock;
const mockRemoveQueryStringParam = removeQueryStringParam as jest.Mock;

describe('Handle Authentication Updated event', () => {
	let history, modifiedUrl, originalUrl;
	const authentication = defaultAuthentication();
	beforeEach(function () {
		jest.clearAllMocks();
		mockAuthenticationTokensGet.mockReturnValue(authentication);

		const url = "https://domain.com";
		originalUrl = `${url}/?some=thing&code=1234&${QS_STATE}=xxx&another=value`;
		modifiedUrl = `${url}/?some=thing&another=value`;
		mockRemoveQueryStringParam.mockReturnValue(modifiedUrl);

		history = {
			pushState: jest.fn()
		};
		Object.defineProperty(global.window, 'history', {
			value: history
		});

		// @ts-ignore
		jsdom.reconfigure({
			url: originalUrl
		});
	});

	test('as expected', async () => {
		handleAuthenticationUpdated(authentication);

		expect(removeQueryStringParam).toHaveBeenCalledWith(originalUrl, QS_AUTH_CODE);
		expect(removeQueryStringParam).toHaveBeenCalledWith(modifiedUrl, QS_STATE);
		expect(history.pushState).toHaveBeenCalledWith(null, null, modifiedUrl);
		expect(Tokens.set).toHaveBeenCalledWith(authentication);
	});

	test('no change to url', async () => {
		mockRemoveQueryStringParam.mockReturnValue(originalUrl);

		handleAuthenticationUpdated(authentication);

		expect(removeQueryStringParam).toHaveBeenCalledWith(originalUrl, QS_AUTH_CODE);
		expect(removeQueryStringParam).toHaveBeenCalledWith(originalUrl, QS_STATE);
		expect(history.pushState).toHaveBeenCalledTimes(0);
		expect(Tokens.set).toHaveBeenCalledWith(authentication);
	});

	test('no authentication', async () => {
		handleAuthenticationUpdated(undefined);

		expect(removeQueryStringParam).toHaveBeenCalledTimes(0);
		expect(history.pushState).toHaveBeenCalledTimes(0);
		expect(Tokens.set).toHaveBeenCalledTimes(0);
	});

	test('no accessToken', async () => {
		// @ts-ignore
		handleAuthenticationUpdated({});

		expect(removeQueryStringParam).toHaveBeenCalledTimes(0);
		expect(history.pushState).toHaveBeenCalledTimes(0);
		expect(Tokens.set).toHaveBeenCalledTimes(0);
	});
});
