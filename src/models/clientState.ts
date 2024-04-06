/**
 * Represents the state passed from a client application to the SSO Broker
 */
export interface ClientState extends Object {
	referrer?: string;
	[key: string]: any;
}
