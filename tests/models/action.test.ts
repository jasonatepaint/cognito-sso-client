import { Action } from "../../src";

const clientId = "12345";
const action = "initialize";
const details = {
    id: "id",
};

describe("Command", () => {
    test("constructor", async () => {
        const cmd = new Action(clientId, action, details);
        expect(cmd.clientId).toEqual(clientId);
        expect(cmd.action).toEqual(action);
        expect(cmd.details).toEqual(details);
    });
});
