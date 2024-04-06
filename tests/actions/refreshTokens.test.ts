import {refreshTokensAction} from "../../src/actions";
import {defaultAuthentication, defaultConfig, defaultUser} from "../data";
import {AuthenticationState} from "../../src/models";
import {Tokens} from "../../src/models/tokens";

jest.mock("../../src/models/tokens");

const mockAuthenticationTokensGet = Tokens.get as jest.Mock;

const config = defaultConfig();
const authentication = defaultAuthentication();
const currentUser = defaultUser();

describe('Refresh Tokens Action', () => {
	let clientId, redirectUri;
	let encodedClientState = "the encoded client state";
	let state;
	const id = "command-id";
	beforeEach(function () {
		jest.clearAllMocks();
		clientId = config.clientId;
		redirectUri = config.redirectUri;

		state = new AuthenticationState();
		state.setUser(currentUser);

		mockAuthenticationTokensGet.mockReturnValue(authentication);
	});

	test('as expected', async () => {
		refreshTokensAction(id, config, state, encodedClientState);
		expect(config.iFrame.contentWindow.postMessage).toHaveBeenCalledWith({
			clientId,
			action: "refreshTokens",
			details: {
				id,
				authentication,
				clientState: encodedClientState
			}
		}, "*");
	});
});
