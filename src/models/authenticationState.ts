import {Tokens} from "./tokens";
import {User} from "./user";

/**
 * Represents the authentication state for the client app
 */
export default class AuthenticationState {

    private _user: User;

    get authentication() { return Tokens.get(); }

    get user() { return this._user; }

    setUser(user: User) {
        this._user = user;
    }

    clearAuthentication() {
        Tokens.clear();
        this._user = undefined;
    }
}
