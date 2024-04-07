import { getLocalStorageWithExpiration, setLocalStorageWithExpiration, removeFromLocalStorage } from "../src/storage";

const date = new Date();
jest.useFakeTimers().setSystemTime(date);

const key = "theKey";
const value = "theValue";
let localStorage: Storage;

beforeAll(() => {
    localStorage = window.localStorage;
});

describe("Local Storage", () => {
    test("Get With Expiration", async () => {
        localStorage.setItem(
            key,
            JSON.stringify({
                value,
                expiration: new Date(new Date().getFullYear() + 1, 1, 1).getTime(),
            }),
        );
        expect(getLocalStorageWithExpiration(key)).toEqual(value);
        expect(localStorage.getItem(key)).toBeDefined();
    });

    test("Get With Expiration - expired", async () => {
        localStorage.setItem(
            key,
            JSON.stringify({
                value,
                expiration: Date.now() - 100, //expired 100ms ago
            }),
        );
        expect(getLocalStorageWithExpiration(key)).toBeUndefined();
        expect(localStorage.getItem(key)).toBeNull();
    });

    test("Set with Expiration as number", async () => {
        setLocalStorageWithExpiration(key, value, 5);
        const item = JSON.parse(localStorage.getItem(key));
        expect(item.value).toEqual(value);
        expect(item.expiration).toEqual(date.getTime() + 5000);
    });

    test("Set with Expiration as date", async () => {
        const dt = new Date(date.getTime() + 5555);
        setLocalStorageWithExpiration(key, value, dt);
        const item = JSON.parse(localStorage.getItem(key));
        expect(item.value).toEqual(value);
        expect(item.expiration).toEqual(dt.getTime());
    });

    test("Remove from storage", async () => {
        setLocalStorageWithExpiration(key, value, 5);
        removeFromLocalStorage(key);
        expect(localStorage.getItem(key)).toBeNull();
    });
});
