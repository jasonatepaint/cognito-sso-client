import { removeQueryStringParam } from "./utils/url";
import { QS_AUTH_CODE, QS_STATE } from "./const";
import { Tokens } from "./models/tokens";

export const handleAuthenticationEvent = (authentication?: Tokens | undefined) => {
    removeProcessedParams();

    if (!authentication || !authentication.accessToken) {
        return;
    }

    Tokens.set(authentication);
};

const removeProcessedParams = () => {
    let url = removeQueryStringParam(window.location.href, QS_AUTH_CODE);
    url = removeQueryStringParam(url, QS_STATE);
    if (url !== window.location.href) {
        window.history.pushState(null, null, url);
    }
};
