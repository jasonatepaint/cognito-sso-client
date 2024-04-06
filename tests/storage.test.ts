import {
	getLocalStorageWithExpiration,
	setLocalStorageWithExpiration,
	removeFromLocalStorage,
	getCookie,
	setCookie,
	removeCookie,
} from "../src/storage";

const date = new Date();
jest.useFakeTimers()
	.setSystemTime(date);

const key = "theKey";
const value = "theValue";
let localStorage;

beforeAll(() => {
	localStorage = window.localStorage;
});

describe('Local Storage', () => {

	test('Get With Expiration', async () => {
		localStorage.setItem(key, JSON.stringify({
			value,
			expiration: new Date(new Date().getFullYear() + 1, 1, 1).getTime()
		}));
		expect(getLocalStorageWithExpiration(key)).toEqual(value);
		expect(localStorage.getItem(key)).toBeDefined();
	});

	test('Get With Expiration - expired', async () => {
		localStorage.setItem(key, JSON.stringify({
			value,
			expiration: Date.now() - 100 //expired 100ms ago
		}));
		expect(getLocalStorageWithExpiration(key)).toBeUndefined();
		expect(localStorage.getItem(key)).toBeNull()
	});

	test('Set with Expiration as number', async () => {
		setLocalStorageWithExpiration(key, value, 5);
		const item = JSON.parse(localStorage.getItem(key));
		expect(item.value).toEqual(value);
		expect(item.expiration).toEqual(date.getTime() + 5000);
	});

	test('Set with Expiration as date', async () => {
		const dt = new Date(date.getTime() + 5555);
		setLocalStorageWithExpiration(key, value, dt);
		const item = JSON.parse(localStorage.getItem(key));
		expect(item.value).toEqual(value);
		expect(item.expiration).toEqual(dt.getTime());
	});

	test('Remove from storage', async () => {
		setLocalStorageWithExpiration(key, value, 5);
		removeFromLocalStorage(key);
		expect(localStorage.getItem(key)).toBeNull();
	});
});

describe('Cookies', () => {
	const name = "myCookie";
	const expiration = new Date(date.getTime() + 5000).toISOString();
	const getFn = jest.fn();
	const setFn = jest.fn();
	let cookie;

	beforeEach(function () {
		jest.clearAllMocks();
		Object.defineProperty(document, 'cookie', {
			get: getFn,
			set: setFn
		});

		cookie = `cookieOne=1234; ${name}=${value}; cookie2=4567;`
		cookie +=

		getFn.mockReturnValue(cookie);
		setFn.mockReturnValue({});
	});

	test('Get Cookie', async () => {
		const v = getCookie(name);
		expect(v).toEqual(value);
		expect(getFn).toHaveBeenCalled();

		expect(getCookie("cookieOne")).toEqual("1234");
		expect(getCookie("cookie2")).toEqual("4567");
	});

	test('Get Cookie - no value', async () => {
		getFn.mockReturnValue('');
		const v = getCookie(name);
		expect(v).toBeUndefined();
		expect(getFn).toHaveBeenCalled();
	});

	test('Remove Cookie', async () => {
		removeCookie(name);
		expect(setFn).toHaveBeenCalled();

		const param = setFn.mock.calls[0][0];
		expect(param).toContain(`${name}=;`);
		expect(param).toContain(`Expires=Thu, 01 Jan 1970 00:00:00 UTC;`);
	});

	test('Set Cookie', async () => {
		setCookie(name, value, expiration);

		expect(setFn).toHaveBeenCalled();
		const param = setFn.mock.calls[0][0];
		expect(param).toContain(`${name}=${value};`);
		expect(param).toContain(`SameSite=Strict;`);
		expect(param).toContain(`Secure;`);
		expect(param).toContain(`Expires=${expiration}`);
	});
});
