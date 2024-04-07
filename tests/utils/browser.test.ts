import { launchUri } from "../../src/utils/browser";
import { defaultConfig } from "../data";

const styleSheets = [{ insertRule: jest.fn() }];
let config;

beforeAll(() => {
    config = defaultConfig();
    Object.defineProperty(document, "styleSheets", {
        get: jest.fn().mockImplementation(() => {
            return styleSheets;
        }),
    });
});

describe("Launch Uri", () => {
    const url = "https://domain.com";

    test("as expected", async () => {
        window.open = jest.fn().mockReturnValue({});
        await launchUri(url);
        expect(window.open).toHaveBeenCalledWith(url, "_self");
    });

    test("no proxy", async () => {
        window.open = jest.fn().mockReturnValue(undefined);
        let failed = false;
        await launchUri(url).catch(() => {
            failed = true;
        });
        expect(failed).toBeTruthy();
    });
});
