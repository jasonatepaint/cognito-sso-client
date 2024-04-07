import { logoutAction } from "../../src/actions";
import { defaultAuthentication, defaultConfig, defaultUser } from "../data";
import { Tokens } from "../../src/models/tokens";
import { AuthenticationState } from "../../src/models";

jest.mock("../../src/models/tokens");

const mockAuthenticationTokensGet = Tokens.get as jest.Mock;

const config = defaultConfig();
const authentication = defaultAuthentication();
const currentUser = defaultUser();

describe("Logout", () => {
    const encodedClientState = "the encoded client state";
    let clientId: string, redirectUri: string, state;
    let redirectToLogin: boolean, clientOnlyLogout: boolean;
    const id = "command-id";

    beforeEach(function () {
        jest.clearAllMocks();
        clientId = config.clientId;
        redirectUri = config.redirectUri;

        state = new AuthenticationState();
        state.setUser(currentUser);

        redirectToLogin = true;
        clientOnlyLogout = false;

        mockAuthenticationTokensGet.mockReturnValue(authentication);
    });

    test("with a redirect", async () => {
        logoutAction(id, config, state, clientOnlyLogout, redirectToLogin, encodedClientState);

        expect(Tokens.clear).toHaveBeenCalled();
        expect(state.user).toBeUndefined();

        expect(config.iFrame.contentWindow.postMessage).toHaveBeenCalledWith(
            {
                clientId,
                action: "logout",
                details: {
                    id,
                    redirectUnauthenticated: true,
                    redirectUri,
                    clientState: encodedClientState,
                    clientOnlyLogout,
                },
            },
            "*",
        );
    });

    test("without redirect", async () => {
        redirectToLogin = false;
        logoutAction(id, config, state, clientOnlyLogout, redirectToLogin, encodedClientState);

        expect(Tokens.clear).toHaveBeenCalled();
        expect(state.user).toBeUndefined();

        expect(config.iFrame.contentWindow.postMessage).toHaveBeenCalledWith(
            {
                clientId,
                action: "logout",
                details: {
                    id,
                    redirectUnauthenticated: false,
                    redirectUri,
                    clientState: encodedClientState,
                    clientOnlyLogout,
                },
            },
            "*",
        );
    });
});
