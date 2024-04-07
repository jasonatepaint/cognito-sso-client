import { parseToken } from "../../src/utils";

describe("Parse Token", () => {
    const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const decoded = {
        sub: "1234567890",
        name: "John Doe",
        iat: 1516239022,
    };

    test("as expected", async () => {
        const t = parseToken(token);
        expect(t).toEqual(decoded);
    });

    test("no token passed", async () => {
        expect(parseToken(undefined)).toBeUndefined();
        expect(parseToken(null)).toBeUndefined();
    });

    test("not a valid token", async () => {
        expect(parseToken("not.valid.token")).toBeUndefined();
        expect(parseToken("nottoken")).toBeUndefined();
    });
});
