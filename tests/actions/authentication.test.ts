import { authenticateAction, initiateCodeFlowAction, redeemCodeAction } from "../../src/actions";
import { getValueFromQueryString } from "../../src/utils/url";
import { defaultAuthentication, defaultConfig } from "../data";
import { Tokens } from "../../src/models/tokens";
import { makeCallbacks } from "../../src/utils/callbacks";

jest.mock("../../src/actions/initiateCodeFlow");
jest.mock("../../src/actions/redeemCode");
jest.mock("../../src/utils/url");
jest.mock("../../src/utils/callbacks");

const mockGetValueFromQueryString = getValueFromQueryString as jest.Mock;

describe("Check Authentication", () => {
    let redirect = true;
    let state, config, authentication, options;
    const id = "command-id";
    const clientState = "eyJyZWZlcnJlciI6IiJ9"; // encoded { referrer: '' }
    const decodedClientState = {
        referrer: "",
    };

    beforeEach(function () {
        authentication = defaultAuthentication();
        state = {
            authentication,
        };
        config = defaultConfig();
        jest.clearAllMocks();
        options = {
            redirect,
        };
    });

    test("has current authentication", async () => {
        authenticateAction(id, config, state, options, clientState);
        expect(config.iFrame.contentWindow.postMessage).toHaveBeenCalledWith(
            {
                clientId: config.clientId,
                action: "authenticate",
                details: {
                    id,
                    redirectUnauthenticated: options.redirect,
                    redirectionReturnUrl: config.ssoUrl,
                    authentication,
                    redirectUri: config.redirectUri,
                    clientState,
                },
            },
            "*",
        );

        expect(initiateCodeFlowAction).toHaveBeenCalledTimes(0);
        expect(redeemCodeAction).toHaveBeenCalledTimes(0);
        expect(makeCallbacks).not.toHaveBeenCalled();
    });

    test("not authenticated with code", async () => {
        state = {};
        mockGetValueFromQueryString.mockReturnValue("1234");

        authenticateAction(id, config, state, options, clientState);

        expect(redeemCodeAction).toHaveBeenCalledWith(id, config, state, "1234", clientState);
        expect(config.iFrame.contentWindow.postMessage).not.toHaveBeenCalled();
        expect(makeCallbacks).not.toHaveBeenCalled();
    });

    test("not authenticated with redirect", async () => {
        state = { currentAuthentication: new Tokens() };
        mockGetValueFromQueryString.mockReturnValue(undefined);

        authenticateAction(id, config, state, options, clientState);

        expect(redeemCodeAction).toHaveBeenCalledTimes(0);
        expect(config.iFrame.contentWindow.postMessage).toHaveBeenCalledTimes(0);
        expect(initiateCodeFlowAction).toHaveBeenCalledWith(config, clientState);
        expect(makeCallbacks).not.toHaveBeenCalled();
    });

    test("not authenticated with no redirect", async () => {
        state = { authentication: new Tokens() };
        mockGetValueFromQueryString.mockReturnValue(undefined);

        options.redirect = false;
        authenticateAction(id, config, state, options, clientState);

        expect(redeemCodeAction).toHaveBeenCalledTimes(0);
        expect(initiateCodeFlowAction).toHaveBeenCalledTimes(0);
        expect(makeCallbacks).toHaveBeenCalledWith(id, config.callbacks, {
            response: "authenticate",
            details: {
                id,
                isAuthenticated: false,
                success: true,
                clientState,
            },
        });
    });
});
