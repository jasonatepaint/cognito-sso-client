import {ClientConfig} from "../src/models";
import {User} from "../src";

const accessToken = "accessToken";
const idToken = "idToken";
const refreshToken = "refreshToken";

export const defaultAuthentication = () => {
	return { accessToken, idToken, refreshToken };
}

export const defaultUser = () => {
	return <User>{
		name: "Bob Loblaw",
		email: "user@email.com",
		phoneNumber: "+13125551212"
	};
};

export const defaultConfig = () => {
	const config = new ClientConfig();
	config.clientId = "123456";
	config.redirectUri = "https://domain.com";
	config.ssoUrl = "https://client-app-1.com";
	config.callbacks = {};
	config.iFrame = {
		// @ts-ignore
		contentWindow: {
			postMessage: jest.fn()
		}
	};
	config.options = {
		autoRefresh: true
	};
	return config;
};

