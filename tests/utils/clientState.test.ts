import Base64 from "crypto-js/enc-base64";
import Utf8 from "crypto-js/enc-utf8";
import { prepare, decodeAndParse, encode, isEncoded } from "../../src/utils/clientState";

const referrer = "http://domain.referrer.com/some/path/";
let encodedValue;

beforeEach(() => {
    // @ts-ignore
    jsdom.reconfigure({
        url: referrer,
    });
    encodedValue = encode({ referrer });
});

describe("Prepare Client State", () => {
    test("null state", () => {
        // if state not provided we expect it to encode an object that contains only the referrer
        const test = null;
        // act
        const result = prepare(test);
        // assert
        expect(result).toBe(encodedValue);
    });

    test("is a string", () => {
        encodedValue = encode({ referrer });
        jest.resetAllMocks();

        // @ts-ignore
        const result = prepare("MyState");

        // assert
        expect(result).toBe(encodedValue);
    });

    test("is not an object", () => {
        encodedValue = encode({ referrer });
        jest.resetAllMocks();

        const result = prepare(<any>1);

        // assert
        expect(result).toBe(encodedValue);
    });

    test("is a base64 string", () => {
        const original = { dt: Date.now(), referrer };
        encodedValue = encode(original);
        jest.resetAllMocks();

        const result = prepare(<any>encode(original));

        // assert
        expect(result).toBe(encodedValue);
    });

    test("is a base64 string without referrer", () => {
        const original = { dt: Date.now() };
        encodedValue = encode({ ...original, referrer });
        jest.resetAllMocks();

        const result = prepare(<any>encode(original));

        // assert
        expect(result).toBe(encodedValue);
    });

    test("appends referrer if it does not exist", () => {
        // if state is provided we expect it appended referrer and encode the object
        encodedValue = encode({ my: "state", snuh: "buh", referrer });
        const result = prepare({ my: "state", snuh: "buh" });

        expect(result).toBe(encodedValue);
    });

    test("referrer already exists", () => {
        const ref = "https://a.different.domain";
        const test = { my: "state", snuh: "buh", referrer: ref };
        encodedValue = encode(test);

        const result = prepare(test);
        expect(result).toBe(encodedValue);
    });
});

describe("Decode and Parse Client State", () => {
    test("Null or Empty", () => {
        expect(decodeAndParse(null)).toBeUndefined();
        expect(decodeAndParse(undefined)).toBeUndefined();
        expect(decodeAndParse("")).toBeUndefined();
    });

    test("not encoded as object", () => {
        const test = {};
        const expected = {};
        // @ts-ignore
        const result = decodeAndParse(test);
        expect(result).toMatchObject(expected);
    });

    test("not encoded as string", () => {
        const test = "this is not base64 encoded";
        const expected = {};
        const result = decodeAndParse(test);
        expect(result).toMatchObject(expected);
    });

    test("fails to decode", async () => {
        const result = decodeAndParse(Base64.stringify(Utf8.parse("test")));
        expect(result).toMatchObject({});
    });

    test("success", () => {
        // expect it to return an object decoded and parsed
        // act
        const result = decodeAndParse(encodedValue);
        const expected = { referrer };

        // assert
        expect(result).toMatchObject(expected);
    });
});

describe("Client State IsEncoded", () => {
    test("encoded", () => {
        // act
        const result = isEncoded(encodedValue);
        // assert
        expect(result).toBeTruthy();
    });

    test("not encoded", () => {
        expect(isEncoded("I'm not encoded")).toBeFalsy();
        expect(isEncoded(null)).toBeFalsy();
        expect(isEncoded(undefined)).toBeFalsy();
        expect(isEncoded("")).toBeFalsy();
        expect(isEncoded(<any>{ the: "object" })).toBeFalsy();
    });
});
