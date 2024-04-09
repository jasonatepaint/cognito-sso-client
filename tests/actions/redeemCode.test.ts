import { getFromLocalStorage } from "../../src/storage";
import { defaultAuthentication, defaultConfig } from "../data";
import { redeemCodeAction } from "../../src/actions";

jest.mock("../../src/storage");

const mockGetLocalStorageWithExpiration = getFromLocalStorage as jest.Mock;

describe("Redeem Authentication Code", () => {
    const id = "command-id";
    const code = "12344";
    const codeVerifier = "947u8343";
    let state, config, authentication;
    const clientState = "eyJyZWZlcnJlciI6IiJ9"; // encoded { referrer: '' }
    const decodedClientState = {
        referrer: "",
    };

    beforeEach(function () {
        authentication = defaultAuthentication();
        state = {
            currentAuthentication: authentication,
        };
        config = defaultConfig();
        mockGetLocalStorageWithExpiration.mockClear();
        mockGetLocalStorageWithExpiration.mockReturnValue(codeVerifier);
    });

    test("as expected", async () => {
        redeemCodeAction(id, config, state, code, clientState);

        expect(config.iFrame.contentWindow.postMessage).toHaveBeenCalledWith(
            {
                clientId: config.clientId,
                action: "redeemCode",
                details: {
                    id,
                    code,
                    codeVerifier,
                    redirectUri: config.redirectUri,
                    clientId: config.clientId,
                    clientState,
                },
            },
            "*",
        );
    });
});
