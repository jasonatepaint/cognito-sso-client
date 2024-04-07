import { Logger } from "./utils/logging";

const localStorage = window.localStorage;

export interface ItemWithExpiration {
    value: string;
    expiration: number;
}

/***
 * Gets an item in storage. If the item exists but expired a null will be returned
 * @param key - key of item
 */
export const getLocalStorageWithExpiration = (key: string): string | undefined => {
    const data = localStorage.getItem(key);
    const item = JSON.parse(data) as ItemWithExpiration;
    if (item) {
        if (item.expiration > new Date().getTime()) {
            return item.value;
        } else {
            Logger.debug("getLocalStorageWithExpiration (Expired)", { key });
            removeFromLocalStorage(key);
        }
    }
};

/***
 * Puts an item in storage with a TTL
 * @param key - key of item
 * @param value - item value
 * @param ttl - Time to Live in seconds or an explicit date
 */
export const setLocalStorageWithExpiration = (key: string, value: string, ttl: number | Date) => {
    const expiration = typeof ttl === "number" ? Date.now() + ttl * 1000 : ttl.getTime();
    const data = JSON.stringify(<ItemWithExpiration>{
        value,
        expiration,
    });
    localStorage.setItem(key, data);
};

export const removeFromLocalStorage = (key: string) => {
    localStorage.removeItem(key);
};
