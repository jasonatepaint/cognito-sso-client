import { initializeAction } from "../../src/actions";
import { defaultConfig } from "../data";
import { Tokens } from "../../src/models/tokens";

jest.mock("../../src/models/tokens");

const config = defaultConfig();

describe("Initialize Action", () => {
    let clientId: string;
    const id = "command-id";
    beforeEach(function () {
        jest.clearAllMocks();
        clientId = config.clientId;
    });

    test("as expected", async () => {
        initializeAction(id, config);
        expect(config.iFrame.contentWindow.postMessage).toHaveBeenCalledWith(
            {
                clientId,
                action: "initialize",
                details: {
                    id,
                },
            },
            "*",
        );
        expect(Tokens.get).toHaveBeenCalledTimes(1);
    });
});
