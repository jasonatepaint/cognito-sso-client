import {
	buildUrlFromConfig,
	getQueryStringParams,
	getValueFromQueryString,
	removeQueryStringParam, removeTrailingSlash
} from "../../src/utils/url";
import {QS_CLIENT_ID, QS_REDIRECT_URI} from "../../src/const";
import {defaultConfig} from "../data";

const url = "http://dummy.com?user=one&other=two";

describe('Remove Trailing Slash', () => {
	test('as expected', async () => {
		expect(removeTrailingSlash(undefined)).toBeUndefined();
		expect(removeTrailingSlash("https://domain.com")).toEqual("https://domain.com")
		expect(removeTrailingSlash("https://domain.com/")).toEqual("https://domain.com")
	});
});

describe('Get Value from Querystring', () => {

	test('as expected', () => {
		// @ts-ignore
		jsdom.reconfigure({
			url
		});
		expect(getValueFromQueryString("user")).toEqual("one");
		expect(getValueFromQueryString("other")).toEqual("two");
		expect(getValueFromQueryString("notThere")).toBeNull();
	});
});

describe('Get Querystring params', () => {

	test('as expected', () => {
		// @ts-ignore
		jsdom.reconfigure({
			url
		});
		expect(getQueryStringParams()).toEqual({
			user: "one",
			other: "two"
		});
	});
});

describe('Remove QueryString Param', () => {
	test('as expected', async () => {
		expect(removeQueryStringParam(url, "user")).toEqual("http://dummy.com?other=two")
		expect(removeQueryStringParam(url, "other")).toEqual("http://dummy.com?user=one")
	});

	test('no querystring params', async () => {
		expect(removeQueryStringParam("http://domain.com", "other")).toEqual("http://domain.com");
		expect(removeQueryStringParam("http://domain.com/other/", "other")).toEqual("http://domain.com/other/");
	});

	test('single querystring value', async () => {
		//if we have a single QS item, we don't want to append the `?` to the end of the qs
		expect(removeQueryStringParam("http://domain.com?code=1234", "code")).toEqual("http://domain.com");
	});
});

describe('Build Url from Config', () => {
	let config, url, encodedRedirectUri, ssoUrl, clientId
	beforeEach(function () {
		config = defaultConfig();
		config.ssoUrl = "https://domain.com";

		ssoUrl = config.ssoUrl;
		clientId = config.clientId;
		encodedRedirectUri = encodeURIComponent(config.redirectUri);

		url = `${ssoUrl}?${QS_CLIENT_ID}=${clientId}&${QS_REDIRECT_URI}=${encodedRedirectUri}`
	});

	test('no additional path', async () => {
		expect(buildUrlFromConfig(config)).toEqual(url);
	});

	test('handles no slash prefix on additionalPath', async () => {
		const additionalPath = "path";
		url = `${ssoUrl}/${additionalPath}?${QS_CLIENT_ID}=${clientId}&${QS_REDIRECT_URI}=${encodedRedirectUri}`
		expect(buildUrlFromConfig(config, additionalPath)).toEqual(url);
	});

	test('handles slash prefix on additionalPath', async () => {
		const additionalPath = "/path";
		url = `${ssoUrl}${additionalPath}?${QS_CLIENT_ID}=${clientId}&${QS_REDIRECT_URI}=${encodedRedirectUri}`
		expect(buildUrlFromConfig(config, additionalPath)).toEqual(url);
	});

	test('handles slash prefix on ssoUrl', async () => {
		url = `${config.ssoUrl}?${QS_CLIENT_ID}=${clientId}&${QS_REDIRECT_URI}=${encodedRedirectUri}`

		config.ssoUrl = "https://domain.com/";
		expect(buildUrlFromConfig(config)).toEqual(url);
	});

	test('additional params without additional path', async () => {
		const params = {
			username: "user@email.com",
			forceLogout: true
		};

		// @ts-ignore
		const p = new URLSearchParams({
			clientId,
			redirectUri: config.redirectUri,
			...params,
		});
		url = `${ssoUrl}?${p.toString()}`

		expect(buildUrlFromConfig(config, undefined, params)).toEqual(url);
	});

	test('additional params', async () => {
		const additionalPath = "path";
		const params = {
			username: "user@email.com",
			forceLogout: true
		};

		// @ts-ignore
		const p = new URLSearchParams({
			clientId,
			redirectUri: config.redirectUri,
			...params
		});
		url = `${ssoUrl}/${additionalPath}?${p.toString()}`

		expect(buildUrlFromConfig(config, additionalPath, params)).toEqual(url);
	});
});
