import {Logger} from "./utils/logging";

const localStorage = window.localStorage;

/***
 * Gets an item in storage. If the item exists but expired a null will be returned
 * @param key - key of item
 */
export const getLocalStorageWithExpiration = (key: string) => {
	const data = localStorage.getItem(key);
	const item = JSON.parse(data);
	if(item){
		if(item.expiration > (new Date().getTime())){
			return item.value;
		}
		else{
			Logger.debug("getLocalStorageWithExpiration (Expired)", { key });
			removeFromLocalStorage(key);
		}
	}
};

/***
 * Puts an item in storage with a TTL
 * @param key - key of item
 * @param value - item value
 * @param ttl - Time to Live in seconds or an explicit date
 */
export const setLocalStorageWithExpiration = (key: string, value: string, ttl: number | Date) => {
	const expiration = typeof ttl === "number" ?
						Date.now() + (ttl * 1000) :
						ttl.getTime();
	const data = JSON.stringify({
		value,
		expiration
	});
	localStorage.setItem(key, data);
};

export const removeFromLocalStorage = (key: string) => {
	localStorage.removeItem(key);
};

export const getCookie = (name: string) => {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	let result;
	if (parts.length === 2)
		result = parts.pop().split(';').shift();
	return result;
};

export const removeCookie = (name: string) => {
	setCookie(name, null, 'Thu, 01 Jan 1970 00:00:00 UTC');
};

export const setCookie = (name: string, value: string, expire: string) => {
	document.cookie = `${name}=${!value ? '' : encodeURIComponent(value)
	}; SameSite=Strict; Secure; Expires=${expire}; Path=/;`;
};
