import { AuthenticationState } from "../../src/models";
import {defaultAuthentication, defaultUser} from "../data";
import {Tokens} from "../../src/models/tokens";

jest.mock("../../src/models/tokens");

const mockAuthenticationTokensGet = Tokens.get as jest.Mock;
const authentication = defaultAuthentication();

describe('Unified State', () => {
	beforeEach(function () {
		mockAuthenticationTokensGet.mockReturnValue(authentication);
	});

	test('clears authentications', async () => {
		const state = new AuthenticationState();
		state.setUser(defaultUser());

		expect(state.authentication).toEqual(authentication);

		state.clearAuthentication();
		expect(Tokens.clear).toHaveBeenCalled();
		expect(state.user).toBeUndefined();
	});
});
