import {QS_CLIENT_ID, QS_REDIRECT_URI} from "../const";
import {ClientConfig} from "../models";

export const removeTrailingSlash = (url: string) => {
	if (!url) return url;
	if (url.endsWith("/")) {
		url = url.substring(0, url.length -1);
	}
	return url;
};

export const getValueFromQueryString = (name: string) => {
	const params = new URLSearchParams(window.location.search);
	return params.get(name);
};

export const getQueryStringParams = () => {
	return Object.fromEntries(new URLSearchParams(window.location.search).entries());
};

/**
 * Removes a parameter from the query string of a url
 */
export const removeQueryStringParam = (url: string, parameter: string) => {
	const urlParts = url.split("?");
	if (urlParts.length >= 2) {
		const params = new URLSearchParams(urlParts[1]);
		params.delete(parameter);

		//If we have no params, return just the url
		const qs = params.toString();
		if (qs.length === 0) {
			return urlParts[0];
		}

		return `${urlParts[0]}?${qs}`;
	}
	return url;
};

export const buildUrlFromConfig = (config: ClientConfig, additionalPath?: string, additionalParams?: object) => {
	const ssoUrl = removeTrailingSlash(config.ssoUrl);
	additionalPath = additionalPath || "";
	if (additionalPath?.length > 0 && !additionalPath.startsWith("/")) {
		additionalPath = `/${additionalPath}`;
	}

	const o = {
		...(QS_CLIENT_ID ? { [QS_CLIENT_ID]: config.clientId } : {}),
		...(QS_REDIRECT_URI ? { [QS_REDIRECT_URI]: config.redirectUri } : {}),
		...additionalParams
	};
	const params = new URLSearchParams(o);
	return `${ssoUrl}${additionalPath}?${params.toString()}`;
};
