import { SsoClient, getTestContext } from "../src/ssoClient";
import { Tokens } from "../src/models/tokens";
import { defaultAuthentication, defaultConfig, defaultUser } from "./data";
import { handleMessage } from "../src/messageHandler";
import { AuthenticationState, ClientConfig } from "../src/models";
import {
    authenticateAction,
    initiateCodeFlowAction,
    initializeAction,
    logoutAction,
    redeemCodeAction,
    refreshTokensAction,
} from "../src/actions";
import { prepare } from "../src/utils/clientState";
import { getValueFromQueryString, removeTrailingSlash } from "../src/utils/url";
import { ActivityMonitor } from "../src/activityMonitor";
import { parseToken } from "../src/utils";
import dayjs from "dayjs";
import { createCallbackId } from "../src/utils/callbacks";
import { Logger, LogLevel } from "../src/utils/logging";
import { TOKEN_CHECK_INTERVAL_SECONDS } from "../src/const";
import { ResponseMessage, User } from "../src";

jest.mock("../src/activityMonitor");
jest.mock("../src/models/tokens");
jest.mock("../src/actions/initiateCodeFlow");
jest.mock("../src/actions/authenticate");
jest.mock("../src/actions/initialize");
jest.mock("../src/actions/logout");
jest.mock("../src/actions/refreshTokens");
jest.mock("../src/actions/redeemCode");
jest.mock("../src/storage");
jest.mock("../src/utils/browser");
jest.mock("../src/utils/url");
jest.mock("../src/utils/tokens");
jest.mock("../src/messageHandler");
jest.mock("../src/utils/clientState");
jest.mock("../src/utils/logging");

const mockAuthenticationTokensGet = Tokens.get as jest.Mock;
const mockRemoveTrailingSlash = removeTrailingSlash as jest.Mock;
const mockPrepare = prepare as jest.Mock;
const mockHandleMessage = handleMessage as jest.Mock;
const mockParseToken = parseToken as jest.Mock;
const mockGetValueFromQueryString = getValueFromQueryString as jest.Mock;

const username = "user@email.com";
let authentication: Tokens, user: User, config: ClientConfig, state: AuthenticationState;
let accessToken: string, idToken: string, refreshToken: string;
let clientId: string, redirectUri: string, ssoUrl: string, redirectToLogin: boolean;
let clientState: any, encodedClientState: string;
let authFrame: HTMLIFrameElement, callback: (message: ResponseMessage) => void;
let handleUserActivity: () => boolean, eventListenerCallback: (e: any) => void;
let date: Date;

beforeEach(() => {
    jest.clearAllMocks();
    authentication = defaultAuthentication();
    user = defaultUser();
    config = defaultConfig();

    date = new Date();
    jest.useFakeTimers().setSystemTime(date);

    accessToken = authentication.accessToken;
    idToken = authentication.idToken;
    refreshToken = authentication.refreshToken;
    mockAuthenticationTokensGet.mockReturnValue(authentication);

    redirectToLogin = true;
    callback = jest.fn();
    encodedClientState = "this is encoded";
    clientId = config.clientId;
    redirectUri = config.redirectUri;
    ssoUrl = config.ssoUrl;
    authFrame = config.iFrame;

    mockRemoveTrailingSlash.mockReturnValue(ssoUrl);
    state = getTestContext().state;

    handleUserActivity = getTestContext().handleUserActivity;
    eventListenerCallback = getTestContext().eventListenerCallback;

    const postMessage = config.iFrame.contentWindow.postMessage as jest.Mock;
    postMessage.mockClear();

    clientState = {};
    mockPrepare.mockReturnValue(encodedClientState);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("Event Listener Callback", () => {
    let origin: string;
    beforeEach(function () {
        origin = ssoUrl;
        mockRemoveTrailingSlash.mockReturnValue(origin);
        SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, callback);
        mockHandleMessage.mockClear();
    });

    test("valid origin", async () => {
        const e = { data: { stuff: "otherStuff" }, origin };
        eventListenerCallback(e);

        expect(handleMessage).toHaveBeenCalledTimes(1);
        expect(handleMessage).toHaveBeenCalledWith(e, expect.any(ClientConfig), expect.any(AuthenticationState));
    });

    test("invalid origin", async () => {
        origin = "https://invalid.domain.com";
        mockRemoveTrailingSlash.mockReturnValue(origin);
        const e = { data: { stuff: "otherStuff" }, origin };
        eventListenerCallback(e);

        expect(handleMessage).toHaveBeenCalledTimes(0);
    });

    test("origin is client portal", async () => {
        origin = "https://client.domain.com";
        // @ts-ignore
        jsdom.reconfigure({
            url: origin,
        });

        mockRemoveTrailingSlash.mockReturnValue(origin);
        const e = { data: { stuff: "otherStuff" }, origin };
        eventListenerCallback(e);

        expect(handleMessage).toHaveBeenCalledTimes(0);
    });
});

describe("Initialize", () => {
    let bindSpy: any, windowEventListenerSpy: any;

    beforeEach(function () {
        // @ts-ignore
        bindSpy = jest.spyOn(callback, "bind", undefined);

        windowEventListenerSpy = jest.spyOn(window, "addEventListener");

        mockAuthenticationTokensGet.mockReturnValue(authentication);
    });

    test("as expected", async () => {
        const id = SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, callback);

        expect(SsoClient.clientId).toEqual(clientId);
        expect(SsoClient.iFrame).toEqual(authFrame);
        expect(SsoClient.ssoUrl).toEqual(ssoUrl);
        expect(SsoClient.redirectUri).toEqual(redirectUri);
        expect(SsoClient.authentication).toEqual(authentication);
        expect(SsoClient.user).toEqual(undefined);

        expect(Logger.setLogLevel).toHaveBeenCalledWith(LogLevel.info); //default

        //callbacks + bind spies
        expect(SsoClient.callbacks[id]).toEqual(callback);
        expect(bindSpy).toHaveBeenCalledWith(SsoClient);

        //activity monitor is set up
        expect(ActivityMonitor.init).toHaveBeenCalledWith({
            onActiveIntervalCallback: handleUserActivity,
        });
        expect(ActivityMonitor.start).toHaveBeenCalledTimes(1);

        //current auth (w/refresh token) - should also try to get access/id tokens
        expect(SsoClient.authentication).toEqual(authentication);

        //Event handler hooked up
        expect(windowEventListenerSpy).toHaveBeenCalledWith("message", eventListenerCallback);

        //authFrame onLoad has been defined
        expect(SsoClient.iFrame.onload).toEqual(expect.any(Function));
    });

    test("no autoRefresh", async () => {
        config.options.autoRefresh = false;
        SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, callback);

        //activity monitor should not have been setup
        expect(ActivityMonitor.start).toHaveBeenCalledTimes(0);
    });

    test("autoRefresh option default", async () => {
        delete config.options.autoRefresh; //not set by user
        SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, callback);

        //defaults to true
        //activity monitor is set up
        expect(ActivityMonitor.start).toHaveBeenCalledTimes(1);
    });

    test("logLevel option", async () => {
        config.options.logLevel = LogLevel.error;
        SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, callback);

        expect(Logger.setLogLevel).toHaveBeenCalledWith(LogLevel.error);
    });

    test("missing clientId", async () => {
        let error;
        try {
            SsoClient.initialize(ssoUrl, undefined, redirectUri, authFrame, config.options, callback);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
    });

    test("empty clientId", async () => {
        let error;
        try {
            SsoClient.initialize(ssoUrl, "", redirectUri, authFrame, config.options, callback);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
    });

    test("missing redirectUri", async () => {
        let error;
        try {
            SsoClient.initialize(ssoUrl, clientId, undefined, authFrame, config.options, callback);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
    });

    test("empty redirectUri", async () => {
        let error;
        try {
            SsoClient.initialize(ssoUrl, clientId, "", authFrame, config.options, callback);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
    });

    test("no callbacks", async () => {
        const id = SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, undefined);

        //callbacks + bind spies
        expect(SsoClient.callbacks[id]).toBeUndefined();
        expect(bindSpy).not.toHaveBeenCalledWith(SsoClient);
    });

    test("no callback", async () => {
        callback = undefined;
        const id = SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, callback);
        expect(SsoClient.callbacks[id]).toBeUndefined();
    });

    test("callback is a function", async () => {
        callback = function () {
            return true;
        };
        let id = SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, callback);
        expect(SsoClient.callbacks[id]).toEqual(callback);

        callback = () => {
            return true;
        };
        id = SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, callback);
        expect(SsoClient.callbacks[id]).toEqual(callback);
    });

    test("callback is not a function", async () => {
        let error;
        try {
            SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, <any>{
                data: "not a function",
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeInstanceOf(Error);

        error = undefined;
        try {
            SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, <any>"a string");
        } catch (e) {
            error = e;
        }
        expect(error).toBeInstanceOf(Error);
    });
});

describe("Register / Unregister Callbacks", () => {
    let id: string, initId: string;
    beforeEach(function () {
        id = "my-callback-id";
        initId = SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, callback);
    });

    test("registers callbacks", async () => {
        const cb = jest.fn();
        const cb2 = jest.fn();
        const bindSpy = jest.spyOn(cb, "bind");
        const bindSpy2 = jest.spyOn(cb2, "bind");

        SsoClient.registerCallback(id, cb);
        SsoClient.registerCallback(id + "2", cb2);

        expect(bindSpy).toHaveBeenCalledWith(SsoClient);
        expect(bindSpy2).toHaveBeenCalledWith(SsoClient);

        expect(SsoClient.callbacks[initId]).toEqual(callback);
        expect(SsoClient.callbacks[id]).toEqual(cb);
        expect(SsoClient.callbacks[id + "2"]).toEqual(cb2);
    });

    test("overwrites callback with same id", async () => {
        const cb = jest.fn();
        SsoClient.registerCallback(id, cb);
        expect(SsoClient.callbacks[id]).toEqual(cb);

        //rewrites callback by id
        const cb2 = jest.fn();
        expect(cb).not.toEqual(cb2);
        SsoClient.registerCallback(id, cb2);
        expect(SsoClient.callbacks[id]).toEqual(cb2);
    });

    test("callback not a function", async () => {
        let cb = { data: "not a function" };
        let error;
        try {
            // @ts-ignore
            SsoClient.registerCallback(id, cb);
        } catch (e) {
            error = e;
        }
        expect(error).toBeInstanceOf(Error);

        // @ts-ignore
        cb = "a string";
        error = undefined;
        try {
            // @ts-ignore
            SsoClient.registerCallback(id, cb);
        } catch (e) {
            error = e;
        }
        expect(error).toBeInstanceOf(Error);
    });

    test("unregisters callback", async () => {
        const cb = jest.fn();
        SsoClient.registerCallback(id, cb);
        expect(SsoClient.callbacks[id]).toEqual(cb);

        SsoClient.unregisterCallback(id);

        expect(SsoClient.callbacks[id]).toBeUndefined();
    });
});

describe("initiate Code Flow", () => {
    beforeEach(function () {
        SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, callback);
    });

    test("as expected", async () => {
        SsoClient.initiateCodeFlow(clientState);

        const ctx = getTestContext();
        expect(initiateCodeFlowAction).toHaveBeenCalledWith(ctx.config, encodedClientState);
        expect(prepare).toHaveBeenCalledWith(clientState);
    });
});

describe("Handle User Activity", () => {
    let tokenExpirationBufferSeconds: number, id: string;

    beforeEach(function () {
        date = new Date();
        jest.clearAllMocks();
        getTestContext().setLastTokenCheck();

        Object.defineProperty(ActivityMonitor, "isActive", {
            get: jest.fn(() => true),
            configurable: true,
        });

        jest.clearAllTimers();
        jest.useFakeTimers().setSystemTime(date);

        //expired 30 mins ago
        mockParseToken.mockReturnValue({
            exp: dayjs(date).subtract(30, "minute").unix(),
        });

        const testContext = getTestContext();
        state = testContext.state;
        config = testContext.config;
        tokenExpirationBufferSeconds = testContext.tokenExpirationBufferSeconds;

        id = createCallbackId("auto-refresh-token");
        config.options.autoRefresh = true;
    });

    test("autoRefresh turned off", async () => {
        config.options.autoRefresh = false;
        const updated = handleUserActivity();
        expect(updated).toBeFalsy();

        expect(parseToken).toHaveBeenCalledTimes(0);
        expect(refreshTokensAction).toHaveBeenCalledTimes(0);
    });

    test("next check is too soon", async () => {
        //first check
        config.options.autoRefresh = true;
        let updated = handleUserActivity();
        expect(updated).toBeTruthy();
        expect(parseToken).toHaveBeenCalledTimes(1);
        expect(refreshTokensAction).toHaveBeenCalledTimes(1);

        //subsequent check
        jest.clearAllMocks();
        updated = handleUserActivity();
        expect(updated).toBeFalsy();

        expect(parseToken).toHaveBeenCalledTimes(0);
        expect(refreshTokensAction).toHaveBeenCalledTimes(0);

        //clear and check again
        getTestContext().setLastTokenCheck();
        updated = handleUserActivity();
        expect(updated).toBeTruthy();
        expect(parseToken).toHaveBeenCalledTimes(1);
        expect(refreshTokensAction).toHaveBeenCalledTimes(1);
    });

    describe("Last Token Check", () => {
        beforeEach(function () {
            config.options.autoRefresh = true;
        });
        test("enough time as elapsed", async () => {
            getTestContext().setLastTokenCheck(
                dayjs(date)
                    .subtract(TOKEN_CHECK_INTERVAL_SECONDS + 1, "second")
                    .toDate()
                    .getTime(),
            );
            let updated = handleUserActivity();
            expect(updated).toBeTruthy();
            expect(initiateCodeFlowAction).toHaveBeenCalledTimes(0);
            expect(parseToken).toHaveBeenCalledTimes(1);
            expect(refreshTokensAction).toHaveBeenCalledTimes(1);
        });

        test("not enough time elapsed", async () => {
            getTestContext().setLastTokenCheck(
                dayjs(date)
                    .subtract(TOKEN_CHECK_INTERVAL_SECONDS - 1, "second")
                    .toDate()
                    .getTime(),
            );
            const updated = handleUserActivity();
            expect(updated).toBeFalsy();
            expect(initiateCodeFlowAction).toHaveBeenCalledTimes(0);
            expect(parseToken).toHaveBeenCalledTimes(0);
            expect(refreshTokensAction).toHaveBeenCalledTimes(0);
        });

        test("no previous check", async () => {
            getTestContext().setLastTokenCheck();
            let updated = handleUserActivity();
            expect(updated).toBeTruthy();
            expect(initiateCodeFlowAction).toHaveBeenCalledTimes(0);
            expect(parseToken).toHaveBeenCalledTimes(1);
            expect(refreshTokensAction).toHaveBeenCalledTimes(1);
        });
    });

    test("token is refreshed", async () => {
        const updated = handleUserActivity();
        expect(updated).toBeTruthy();

        expect(initiateCodeFlowAction).toHaveBeenCalledTimes(0);
        expect(parseToken).toHaveBeenCalledWith(accessToken);
        expect(refreshTokensAction).toHaveBeenCalledWith(id, config, state);
    });

    test("no user activity", async () => {
        Object.defineProperty(ActivityMonitor, "isActive", {
            get: jest.fn(() => false),
            configurable: true,
        });

        const updated = handleUserActivity();
        expect(updated).toBeFalsy();

        expect(initiateCodeFlowAction).toHaveBeenCalledTimes(0);
        expect(parseToken).toHaveBeenCalledTimes(0);
        expect(refreshTokensAction).toHaveBeenCalledTimes(0);
    });

    test("missing refresh token", async () => {
        delete state.authentication.refreshToken;
        const updated = handleUserActivity();
        expect(updated).toBeFalsy();

        expect(initiateCodeFlowAction).toHaveBeenCalledWith(config);
        expect(parseToken).toHaveBeenCalledTimes(0);
        expect(refreshTokensAction).toHaveBeenCalledTimes(0);
    });

    test("missing accessToken", async () => {
        delete state.authentication.accessToken;
        mockParseToken.mockReturnValue(undefined);

        const updated = handleUserActivity();
        expect(updated).toBeTruthy();

        expect(parseToken).toHaveBeenCalledTimes(0);
        expect(refreshTokensAction).toHaveBeenCalledWith(id, config, state);
    });

    test("invalid accessToken", async () => {
        mockParseToken.mockReturnValue(undefined);

        const updated = handleUserActivity();
        expect(updated).toBeTruthy();

        expect(parseToken).toHaveBeenCalledWith(accessToken);
        expect(refreshTokensAction).toHaveBeenCalledWith(id, config, state);
    });

    test("missing idToken", async () => {
        delete state.authentication.idToken;

        const updated = handleUserActivity();
        expect(updated).toBeTruthy();

        expect(parseToken).toHaveBeenCalledTimes(0);
        expect(refreshTokensAction).toHaveBeenCalledWith(id, config, state);
    });

    test("token expiration within buffer range", async () => {
        //token expiration falls within the buffer
        mockParseToken.mockReturnValue({
            exp: dayjs()
                .add(TOKEN_CHECK_INTERVAL_SECONDS + tokenExpirationBufferSeconds - 1, "second")
                .unix(),
        });

        const updated = handleUserActivity();
        expect(updated).toBeTruthy();

        expect(parseToken).toHaveBeenCalledWith(accessToken);
        expect(refreshTokensAction).toHaveBeenCalledWith(id, config, state);
    });

    test("token expiration not in buffer range", async () => {
        //token expiration does not fall within buffer
        mockParseToken.mockReturnValue({
            exp: dayjs()
                .add(TOKEN_CHECK_INTERVAL_SECONDS + tokenExpirationBufferSeconds + 10, "second")
                .unix(),
        });

        const updated = handleUserActivity();
        expect(updated).toBeFalsy();

        expect(parseToken).toHaveBeenCalledWith(accessToken);
        expect(refreshTokensAction).toHaveBeenCalledTimes(0);
    });
});

describe("OnLoad Event", () => {
    beforeEach(() => {
        mockGetValueFromQueryString.mockReturnValue(encodedClientState);
    });

    test("as expected", async () => {
        const options = {
            autoRefresh: true,
            styles: {},
        };
        const id = SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, options, callback);
        SsoClient.onLoadEvent(id);

        const { config } = getTestContext();
        expect(initializeAction).toHaveBeenCalledWith(id, config);
    });

    test("no styles", async () => {
        const id = SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, undefined, callback);
        SsoClient.onLoadEvent(id);

        const { config } = getTestContext();
        expect(initializeAction).toHaveBeenCalledWith(id, config);
    });
});

describe("Redeem Authentication Code", () => {
    const code = "12344";
    let id;
    beforeEach(function () {
        mockAuthenticationTokensGet.mockReturnValue(authentication);
        SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, callback);
        id = createCallbackId("redeemCode");
    });

    test("as expected", async () => {
        const { config, state } = getTestContext();
        SsoClient.redeemAuthenticationCode(code, clientState);
        expect(prepare).toHaveBeenCalledWith(clientState);
        expect(redeemCodeAction).toHaveBeenCalledWith(id, config, state, code, encodedClientState);
    });

    test("with callback", async () => {
        const { config, state } = getTestContext();
        const callback = jest.fn();
        const bindSpy = jest.spyOn(callback, "bind");
        SsoClient.redeemAuthenticationCode(code, clientState, callback);
        expect(prepare).toHaveBeenCalledWith(clientState);
        expect(redeemCodeAction).toHaveBeenCalledWith(id, config, state, code, encodedClientState);
        expect(config.callbacks[id]).toEqual(callback);
        expect(bindSpy).toHaveBeenCalledWith(SsoClient);
    });
});

describe("Check Authentication", () => {
    let id;
    let options;
    beforeEach(function () {
        SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, options, callback);
        id = createCallbackId("authenticate");
        options = {
            redirect: redirectToLogin,
            username,
        };
    });

    test("as expected", async () => {
        const { config, state } = getTestContext();
        SsoClient.authenticate(options, clientState);
        expect(authenticateAction).toHaveBeenCalledWith(id, config, state, options, encodedClientState);
        expect(prepare).toHaveBeenCalledWith(clientState); // make sure client state is encoded
    });

    test("with callback", async () => {
        const { config, state } = getTestContext();
        const callback = jest.fn();
        const bindSpy = jest.spyOn(callback, "bind");

        SsoClient.authenticate(options, clientState, callback);
        expect(authenticateAction).toHaveBeenCalledWith(id, config, state, options, encodedClientState);
        expect(prepare).toHaveBeenCalledWith(clientState); // make sure client state is encoded
        expect(config.callbacks[id]).toEqual(callback);
        expect(bindSpy).toHaveBeenCalledWith(SsoClient);
    });
});

describe("Logout", () => {
    let id;
    beforeEach(function () {
        id = createCallbackId("logout");
        SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, callback);
    });

    test("no callback", async () => {
        const options = {
            clientOnly: false,
            redirect: true,
        };
        SsoClient.logout(options, clientState);

        const { config, state } = getTestContext();
        expect(prepare).toHaveBeenCalledWith(clientState); // make sure client state is encoded
        expect(logoutAction).toHaveBeenCalledWith(id, config, state, false, true, encodedClientState);
    });

    test("with callback", async () => {
        const callback = jest.fn();
        const bindSpy = jest.spyOn(callback, "bind");

        const options = {
            clientOnly: false,
            redirect: true,
        };
        SsoClient.logout(options, clientState, callback);

        const { config, state } = getTestContext();
        expect(prepare).toHaveBeenCalledWith(clientState); // make sure client state is encoded
        expect(logoutAction).toHaveBeenCalledWith(id, config, state, false, true, encodedClientState);
        expect(config.callbacks[id]).toEqual(callback);
        expect(bindSpy).toHaveBeenCalledWith(SsoClient);
    });
});

describe("Refresh Tokens", () => {
    let id;
    beforeEach(function () {
        SsoClient.initialize(ssoUrl, clientId, redirectUri, authFrame, config.options, callback);
        id = createCallbackId("refreshTokens");
    });

    test("as expected", async () => {
        const { config, state } = getTestContext();
        SsoClient.refreshTokens(clientState);
        expect(prepare).toHaveBeenCalledWith(clientState); // make sure client state is encoded
        expect(refreshTokensAction).toHaveBeenCalledWith(id, config, state, encodedClientState);
    });

    test("with callback", async () => {
        const { config, state } = getTestContext();
        const callback = jest.fn();
        const bindSpy = jest.spyOn(callback, "bind");

        SsoClient.refreshTokens(clientState, callback);

        expect(prepare).toHaveBeenCalledWith(clientState); // make sure client state is encoded
        expect(refreshTokensAction).toHaveBeenCalledWith(id, config, state, encodedClientState);
        expect(config.callbacks[id]).toEqual(callback);
        expect(bindSpy).toHaveBeenCalledWith(SsoClient);
    });
});
