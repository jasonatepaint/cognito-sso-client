import { authorizeAction } from "../../src/actions";
import {generateChallenge, generateRandom, buildUrlFromConfig} from "../../src/utils";
import {setLocalStorageWithExpiration} from "../../src/storage";
import {CODE_VERIFIER_STORAGE_KEY, QS_STATE} from "../../src/const";
import {launchUri} from "../../src/utils/browser";
import {defaultConfig} from "../data";

const config = defaultConfig();

jest.mock("../../src/utils/browser");
jest.mock("../../src/storage");
jest.mock("../../src/utils/tokens");

const generateRandomMocked = generateRandom as jest.Mock;
const generateChallengeMocked = generateChallenge as jest.Mock;
const setLocalStorageWithExpirationMocked = setLocalStorageWithExpiration as jest.Mock;
const launchUriMocked = launchUri as jest.Mock;

describe('Authorize', () => {
	const pkceKey = "1231433423423";
	const codeChallenge = "hdsljhasdlfhasdfsaf";

	beforeEach(function () {
		generateRandomMocked.mockClear();
		generateRandomMocked.mockReturnValue(pkceKey);

		generateChallengeMocked.mockClear();
		generateChallengeMocked.mockReturnValue(codeChallenge);

		setLocalStorageWithExpirationMocked.mockClear();
	});

	test('as expected', async () => {
		const encodedClientState = "this-is-encoded";
		authorizeAction(config, encodedClientState);

		expect(generateRandomMocked).toHaveBeenCalledWith(128);
		expect(setLocalStorageWithExpirationMocked).toHaveBeenCalledWith(CODE_VERIFIER_STORAGE_KEY, pkceKey, 300);
		expect(generateChallengeMocked).toHaveBeenCalledWith(pkceKey);
		const url = `${buildUrlFromConfig(config)}&codeChallenge=${codeChallenge}&${QS_STATE}=${encodedClientState}`;
		expect(launchUriMocked).toHaveBeenCalledWith(url);
	});

	test('no clientState', async () => {
		authorizeAction(config);

		expect(generateRandomMocked).toHaveBeenCalledWith(128);
		expect(setLocalStorageWithExpirationMocked).toHaveBeenCalledWith(CODE_VERIFIER_STORAGE_KEY, pkceKey, 300);
		expect(generateChallengeMocked).toHaveBeenCalledWith(pkceKey);
		const url = `${buildUrlFromConfig(config)}&codeChallenge=${codeChallenge}`;
		expect(launchUriMocked).toHaveBeenCalledWith(url);
	});
});
