import {
    authorizeAction,
    checkAuthenticationAction,
    initializeAction,
    logoutAction,
    redeemCodeAction,
    refreshTokensAction,
} from "./actions";
import { ActionType, AuthenticationState, ClientConfig } from "./models";
import { handleMessage } from "./messageHandler";
import { prepare } from "./utils/clientState";
import { ActivityMonitor } from "./activityMonitor";
import { parseToken } from "./utils";
import dayjs from "dayjs";
import { createCallbackId } from "./utils/callbacks";
import { Tokens } from "./models/tokens";
import { ClientState, User } from "./models";
import { CheckAuthenticationOptions, InitializeOptions, LogoutOptions } from "./models/options";
import { FunctionCallbacks, ResponseMessage } from "./models/response";
import { removeTrailingSlash } from "./utils/url";
import { Logger, LogLevel } from "./utils/logging";
import { TOKEN_CHECK_INTERVAL_SECONDS } from "./const";

const tokenExpirationBufferSeconds = 30;

let config = new ClientConfig();
let state = new AuthenticationState();
let lastTokenCheck: number;

/**
 * Unified Login Namespace
 * */
export class SsoClient {
    /**
     * The client id for the app
     **/
    static get clientId(): string {
        return config.clientId;
    }

    /**
     * The registered Client redirect Uri
     */
    static get redirectUri(): string {
        return config.redirectUri;
    }

    /**
     * The URL of the SSO Broker site
     */
    static get ssoUrl(): string {
        return config.ssoUrl;
    }

    /**
     * holds a reference to the iframe that communicates with the SSO Broker site
     * */
    static get iFrame(): HTMLIFrameElement {
        return config.iFrame;
    }

    /**
     * The callback methods that handle responses to Unified Login Authentication Component API commands
     * */
    static get callbacks(): FunctionCallbacks {
        return config.callbacks;
    }

    /**
     * holds references to authentication tokens
     **/
    static get authentication(): Tokens {
        return Tokens.get();
    }

    /**
     * holds an object whose properties describe the current user
     * */
    static get user(): User {
        return state.user;
    }

    /**
     * initializes authentication communication
     * - registers the iframe hosting the authentication component
     * - registers callback methods
     * - creates necessary event handlers for communication
     * @param ssoUrl URL of the Cognito SSO Identity Broker site
     * @param clientId The designated client id for the app
     * @param redirectUri A registered redirect URI for the client app
     * @param authFrame iframe element with auth component
     * @param options
     * @param callback - a callback method called when complete
     */
    static initialize(
        ssoUrl: string,
        clientId: string,
        redirectUri: string,
        authFrame: HTMLIFrameElement,
        options?: InitializeOptions,
        callback?: (message: ResponseMessage) => void,
    ): string {
        if (!clientId || clientId.length === 0) {
            throw new Error("clientId is required");
        }

        if (!redirectUri || redirectUri.length === 0) {
            throw new Error("redirectUri is required");
        }

        //merge users options on top of defaults
        options = {
            autoRefresh: true,
            ...(options || {}),
        };

        ActivityMonitor.init({
            onActiveIntervalCallback: handleUserActivity,
        });
        if (options.autoRefresh) {
            lastTokenCheck = new Date().getTime();
            ActivityMonitor.start();
        }

        //default to info if missing or invalid
        if (!options.logLevel || !Object.values(LogLevel).includes(options.logLevel)) {
            options.logLevel = LogLevel.info;
        }
        Logger.setLogLevel(options.logLevel);

        config = new ClientConfig();
        state = new AuthenticationState();

        config.iFrame = authFrame;
        config.clientId = clientId;
        config.redirectUri = redirectUri;
        config.ssoUrl = removeTrailingSlash(ssoUrl);
        config.options = options;

        // Register the call back
        const actionId = registerTemporaryCallback(callback, "initialize");

        // Add an event handler for communication from auth component.
        window.addEventListener("message", eventListenerCallback);

        // Set auth component styles on load.
        if (config.iFrame) {
            config.iFrame.onload = () => SsoClient.onLoadEvent(actionId);
        }

        return actionId;
    }

    static onLoadEvent = (commandId: string) => {
        //Now that our frame is loaded, send the initialize command
        initializeAction(commandId, config);
    };

    /**
     * Registers a callback that will receive all messages from the component api
     */
    static registerCallback(id: string, callback: (message: ResponseMessage) => void) {
        if (!id || !callback) return;
        if (typeof callback !== "function") {
            throw new Error("Callback should be a function. Actual: " + typeof callback);
        }
        callback.bind(this);
        config.callbacks[id] = callback;
        Logger.debug(`registered callback: ${id}`, Object.keys(config.callbacks));
    }

    /**
     * Unregisters a callback by its id
     */
    static unregisterCallback(id: string) {
        if (!id) return;
        delete config.callbacks[id];
        Logger.debug(`unregistered callback: ${id}`, Object.keys(config.callbacks));
    }

    /**
     * Initiates the Authentication process for the user
     * @param clientState - a client supplied value that is returned with the response
     */
    static authorize(clientState?: ClientState) {
        const encodedClientState = prepare(clientState);
        authorizeAction(config, encodedClientState);
    }

    /**
     * Exchanges an authentication code for authentication tokens
     * @param code - authentication code
     * @param clientState - a client supplied value that is returned with the response
     * @param callback - a callback method called when complete
     */
    static redeemAuthenticationCode(
        code: string,
        clientState?: ClientState,
        callback?: (message: ResponseMessage) => void,
    ) {
        const encodedClientState = prepare(clientState);
        const id = registerTemporaryCallback(callback, "redeemCode");
        redeemCodeAction(id, config, state, code, encodedClientState);
        return id;
    }

    /**
     * checks if the current user is authenticated
     * @param options
     * @param clientState - a client supplied value that is returned with the response
     * @param callback - a callback method called when complete
     */
    static checkAuthentication(
        options: CheckAuthenticationOptions,
        clientState?: ClientState,
        callback?: (message: ResponseMessage) => void,
    ) {
        const encodedClientState = prepare(clientState);
        const id = registerTemporaryCallback(callback, "checkAuthentication");
        checkAuthenticationAction(id, config, state, options, encodedClientState);
        return id;
    }

    /**
     * Logs out the  user
     * @param options - Logout Options
     * @param clientState -The raw client state object
     * @param callback - a callback method called when complete
     */
    static logout(
        options: LogoutOptions,
        clientState: ClientState,
        callback?: (message: ResponseMessage) => void,
    ): string {
        const encodedClientState = prepare(clientState);
        const id = registerTemporaryCallback(callback, "logout");
        logoutAction(id, config, state, options.clientOnly, options.redirect, encodedClientState);
        return id;
    }

    /**
     * Refreshes client tokens
     * @param clientState - a client supplied value that is returned with the response
     * @param callback - a callback method called when complete
     */
    static refreshTokens(clientState?: ClientState, callback?: (message: ResponseMessage) => void) {
        const encodedClientState = prepare(clientState);
        const id = registerTemporaryCallback(callback, "refreshTokens");
        refreshTokensAction(id, config, state, encodedClientState);
        return id;
    }
}

const handleUserActivity = (): boolean => {
    const elapsedMs = new Date().getTime() - (lastTokenCheck || 0);
    if (!config.options.autoRefresh || !ActivityMonitor.isActive || elapsedMs <= TOKEN_CHECK_INTERVAL_SECONDS * 1000) {
        return false;
    }

    lastTokenCheck = new Date().getTime();
    const tokens = Tokens.get();
    let refreshRequired = tokens && (!tokens?.accessToken || !tokens?.idToken);

    if (!tokens?.refreshToken) {
        Logger.warn("Unable to refresh -- no refreshToken");
        authorizeAction(config);
        return false;
    } else if (!refreshRequired) {
        // determine our next check time w/a buffer. If the expiration is after that time (+ buffer) we'll require a refresh
        const accessToken = parseToken(tokens.accessToken);
        const nextCheck = dayjs().add(TOKEN_CHECK_INTERVAL_SECONDS + tokenExpirationBufferSeconds, "second");
        refreshRequired = accessToken ? nextCheck.isAfter(dayjs.unix(accessToken.exp)) : true;
    }

    if (refreshRequired) {
        Logger.info("token refresh is required");
        refreshTokensAction(createCallbackId("auto-refresh-token"), config, state);
        return true;
    }

    return false;
};

const registerTemporaryCallback = (callback: (message: ResponseMessage) => void, action: ActionType) => {
    const id = createCallbackId(action);
    if (callback) {
        SsoClient.registerCallback(id, callback);
    }
    return id;
};

const eventListenerCallback = (e: MessageEvent) => {
    //Ignore events that are sent by the client app
    if (e.origin === window.location.origin) {
        return;
    }

    if (e.origin === config.ssoUrl) {
        handleMessage(e, config, state);
    } else {
        Logger.warn("Posted message origin does not match expected, stop processing", {
            expected: config.ssoUrl,
            actual: e.origin,
            message: e,
        });
    }
};

export const getTestContext = () => {
    return {
        config,
        state,
        eventListenerCallback,
        handleUserActivity,
        tokenExpirationBufferSeconds,
        setLastTokenCheck: (dt?: number | undefined) => {
            lastTokenCheck = dt;
        },
    };
};
