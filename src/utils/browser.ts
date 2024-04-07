export const launchUri = (url: string) => {
    const SELF = "_self";
    const windowProxy = window.open(url, SELF);
    if (windowProxy) {
        return Promise.resolve(windowProxy);
    } else {
        return Promise.reject();
    }
};
