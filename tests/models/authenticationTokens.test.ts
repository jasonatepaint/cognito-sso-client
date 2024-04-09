import { Tokens, REFRESH_TOKEN_EXPIRATION_DAYS } from "../../src/models/tokens";
import {
    getFromLocalStorageWithExpiration,
    removeFromLocalStorage,
    setLocalStorageWithExpiration,
} from "../../src/storage";
import { defaultAuthentication } from "../data";
import { AUTH_ACCESS_STORAGE_KEY, AUTH_ID_STORAGE_KEY, AUTH_REFRESH_STORAGE_KEY } from "../../src/const";
import { parseToken } from "../../src/utils";

jest.mock("../../src/storage");
jest.mock("../../src/utils");

const mockGetLocalStorageWithExpiration = getFromLocalStorageWithExpiration as jest.Mock;
const mockParseToken = parseToken as jest.Mock;

let authentication;

describe("Authentication Tokens", () => {
    beforeEach(function () {
        jest.clearAllMocks();
        authentication = defaultAuthentication();
        mockGetLocalStorageWithExpiration.mockImplementation(getFromLocalStorage);
    });

    const getFromLocalStorage = (key) => {
        switch (key) {
            case AUTH_ACCESS_STORAGE_KEY:
                return authentication.accessToken;
            case AUTH_ID_STORAGE_KEY:
                return authentication.idToken;
            case AUTH_REFRESH_STORAGE_KEY:
                return authentication.refreshToken;
        }
    };

    test("ctor", async () => {
        const auth = new Tokens(authentication);
        expect(auth.accessToken).toEqual(authentication.accessToken);
        expect(auth.idToken).toEqual(authentication.idToken);
        expect(auth.refreshToken).toEqual(authentication.refreshToken);
    });

    test("properties frozen", async () => {
        const auth = new Tokens(authentication);
        const changeProp = (prop) => {
            let error;
            try {
                auth[prop] = "nope";
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
        };
        changeProp("accessToken");
        changeProp("idToken");
        changeProp("refreshToken");
    });

    test("get as expected", async () => {
        const auth = Tokens.get();
        expect(auth.accessToken).toEqual(authentication.accessToken);
        expect(auth.idToken).toEqual(authentication.idToken);
        expect(auth.refreshToken).toEqual(authentication.refreshToken);

        expect(getFromLocalStorageWithExpiration).toHaveBeenCalledWith(AUTH_REFRESH_STORAGE_KEY);
        expect(getFromLocalStorageWithExpiration).toHaveBeenCalledWith(AUTH_ACCESS_STORAGE_KEY);
        expect(getFromLocalStorageWithExpiration).toHaveBeenCalledWith(AUTH_ID_STORAGE_KEY);
    });

    describe("Set Tokens", () => {
        let expiration;
        beforeEach(function () {
            const date = new Date();
            expiration = new Date(date.getTime() * 1000);
            mockParseToken.mockReturnValue({ exp: date.getTime() });
        });

        test("as expected", async () => {
            Tokens.set(authentication);

            expect(parseToken).toHaveBeenCalledWith(authentication.accessToken);
            expect(setLocalStorageWithExpiration).toHaveBeenCalledWith(
                AUTH_ACCESS_STORAGE_KEY,
                authentication.accessToken,
                expiration,
            );
            expect(setLocalStorageWithExpiration).toHaveBeenCalledWith(
                AUTH_ID_STORAGE_KEY,
                authentication.idToken,
                expiration,
            );

            expiration = 60 * 60 * REFRESH_TOKEN_EXPIRATION_DAYS;
            expect(setLocalStorageWithExpiration).toHaveBeenCalledWith(
                AUTH_REFRESH_STORAGE_KEY,
                authentication.refreshToken,
                expiration,
            );
        });

        test("missing authentication", async () => {
            mockParseToken.mockReturnValue(undefined);
            Tokens.set(undefined);

            expect(parseToken).toHaveBeenCalledWith(undefined);
            expect(setLocalStorageWithExpiration).toHaveBeenCalledTimes(0);
        });

        test("cannot parse accessToken", async () => {
            mockParseToken.mockReturnValue(undefined);

            Tokens.set(authentication);

            expect(parseToken).toHaveBeenCalledWith(authentication.accessToken);
            expect(setLocalStorageWithExpiration).toHaveBeenCalledTimes(0);
        });

        test("missing accessToken", async () => {
            delete authentication.accessToken;
            mockParseToken.mockReturnValue(undefined);

            Tokens.set(authentication);

            expect(parseToken).toHaveBeenCalledWith(undefined);
            expect(setLocalStorageWithExpiration).toHaveBeenCalledTimes(0);
        });

        test("missing idToken", async () => {
            delete authentication.idToken;
            Tokens.set(authentication);

            expect(parseToken).toHaveBeenCalledWith(authentication.accessToken);

            expect(setLocalStorageWithExpiration).toHaveBeenCalledWith(
                AUTH_ACCESS_STORAGE_KEY,
                authentication.accessToken,
                expiration,
            );
            expect(setLocalStorageWithExpiration).not.toHaveBeenCalledWith(
                AUTH_ID_STORAGE_KEY,
                expect.anything(),
                expect.anything(),
            );
            expect(setLocalStorageWithExpiration).toHaveBeenCalledWith(
                AUTH_REFRESH_STORAGE_KEY,
                authentication.refreshToken,
                expect.anything(),
            );
        });

        test("missing refreshToken", async () => {
            delete authentication.refreshToken;
            Tokens.set(authentication);

            expect(parseToken).toHaveBeenCalledWith(authentication.accessToken);

            expect(setLocalStorageWithExpiration).toHaveBeenCalledWith(
                AUTH_ACCESS_STORAGE_KEY,
                authentication.accessToken,
                expiration,
            );
            expect(setLocalStorageWithExpiration).toHaveBeenCalledWith(
                AUTH_ID_STORAGE_KEY,
                authentication.idToken,
                expiration,
            );
            expect(setLocalStorageWithExpiration).not.toHaveBeenCalledWith(
                AUTH_REFRESH_STORAGE_KEY,
                expect.anything(),
                expect.anything(),
            );
        });
    });

    test("clear", async () => {
        Tokens.clear();
        expect(removeFromLocalStorage).toHaveBeenCalledWith(AUTH_REFRESH_STORAGE_KEY);
        expect(removeFromLocalStorage).toHaveBeenCalledWith(AUTH_ACCESS_STORAGE_KEY);
        expect(removeFromLocalStorage).toHaveBeenCalledWith(AUTH_ID_STORAGE_KEY);
    });
});
