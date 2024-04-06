import {Tokens} from "./tokens";
import {User} from "./user";

enum Responses {
	initialized,
	checkAuthentication,
	logout,
	redeemCode,
	refreshTokens,
	redirectToLogin
}

export type ResponseType = keyof typeof Responses;

export interface FunctionCallbacks { [key: string]: (message: ResponseMessage) => void }

export interface ResponseDetails {
	/**
	 * The Action id that initiated this response
	 */
	id?: string;

	/**
	 * Indicates if the call was successful
	 */
	success: boolean;

	/**
	 * Indicates if the user is authenticated
	 */
	isAuthenticated?: boolean;

	/**
	 * The user's tokens, if they're authenticated
	 */
	authentication?: Tokens;

	/**
	 * The user, if they're authenticated
	 */
	user?: User;

	/**
	 * The current state of the client
	 */
	clientState?: string;

	/**
	 * If present, the error caused by the request
	 */
	error?: string;
}

export interface ResponseMessage {
	response: ResponseType;
	details: ResponseDetails;
}
