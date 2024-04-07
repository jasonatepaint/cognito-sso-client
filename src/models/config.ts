import { ClientState } from "./clientState";
import { FunctionCallbacks } from "./response";
import { InitializeOptions } from "./options";

export class ClientConfig {
    clientState: ClientState;
    clientId: string;
    redirectUri: string;
    ssoUrl: string;
    iFrame: HTMLIFrameElement;
    options: InitializeOptions;
    callbacks: FunctionCallbacks;

    constructor() {
        this.callbacks = {};
        this.options = {
            autoRefresh: true,
        };
    }
}
