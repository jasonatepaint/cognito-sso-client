/**
 * Represents the state passed from a client application to the SSO Broker
 */
export interface ClientState {
    referrer?: string;
    [key: string]: any;
}
