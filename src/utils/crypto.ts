import Base64 from "crypto-js/enc-base64";

/* istanbul ignore next */
export const base64URL = (val: string) => {
    return (
        val
            /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
            // @ts-ignore
            .toString(Base64)
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
    );
};

/* istanbul ignore next */
export const bufferToString = (buffer) => {
    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const state = [];
    for (let i = 0; i < buffer.byteLength; i += 1) {
        const index = buffer[i] % CHARSET.length;
        state.push(CHARSET[index]);
    }
    return state.join("");
};
