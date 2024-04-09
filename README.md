# Cognito SSO Client Library
The client library handles all of the communication between the client application and the SSO broker.

![Client Broker Diagram](https://raw.githubusercontent.com/jasonatepaint/cognito-identity-broker-web/master/docs/client-broker-diagram.png)

This client library is intended to be used with the following projects:

#### 1. [Cognito Identity Broker](https://github.com/jasonatepaint/cognito-identity-broker/README.md) -- This is the Cognito identity broker API stack.
#### 2. [SSO Broker Web]() -- This is the identity broker web app that allows single sign and communicates with the `Cognito Identity Broker` API.
#### 3. [Client App](https://github.com/jasonatepaint/cognito-identity-broker-web/blob/master/client-app/README.md) -- An example client application that communicates with the **SSO Broker** using this client library.

---


## Using the Client Library
To setup the communications between a client app and the SSO broker, 3 pieces of configuration are needed:

#### 1. An iframe that allows the communication between the client and broker

```typescript jsx
<iframe
    style={{ display: "none" }}
    ref={authFrameRef}
    id="authFrame"
    sandbox="allow-same-origin allow-scripts"
    src={BROKER_CLIENT_URL}
></iframe>
```

#### 2. Initialization of the SSO Client library

```typescript
SsoClient.initialize(
  BROKER_URL,
  CLIENT_ID,
  REDIRECT_URI,
  authFrameRef.current as HTMLIFrameElement,
  {
    logLevel: LogLevel.info,
  },
  () => {
    const state = getClientState();
    SsoClient.authenticate({ redirect: true }, state);
  },
);
```

#### 3. Create a callback function and register it
This will be called when the SSO broker has a `ResponseMessage` for the client app. Callbacks can be registered in 2 ways: 
  1. `Global` -- These are created/removed via `SSOClient.registerCallback`
  2. `Single Instance` -- These are 1 time use callbacks on action methods (e.g. `authenticate`, `redeemCode`, `refreshToken`, etc.)

```typescript
const onAuthResponse = (r: ResponseMessage) => {
  const { user, isAuthenticated = false } = r.details;
  //logic goes here
};

SsoClient.registerCallback("default", onAuthResponse);
```

---

## Client Properties
```typescript
interface SSOClient {
  clientId: string              //The client id for the app
  redirectUri: string           //The registered Client redirect Uri
  ssoUrl: string                //The URL of the SSO Broker site
  iFrame: HTMLIFrameElement     //A reference to the auth iframe
  callbacks: FunctionCallbacks  //The callback methods that handle responses
  authentication?: Tokens       //The user's authentication tokens
  user?: User                   //The current user
}
```


## Client Methods

### Initialize
Sets up the communication between the client and the SSO Broker.

```typescript
function initialize(
    ssoUrl: string,
    clientId: string,
    redirectUri: string,
    authFrame: HTMLIFrameElement,
    options?: {
        autoRefresh?: boolean;
        logLevel?: LogLevel;
    },
    callback?: (message: ResponseMessage) => void
) {};
```

###### Parameters:
- `ssoUrl` -- The URL of the Cognito SSO Identity Broker site
- `clientId` -- The designated client id for the app
- `redirectUri` -- A registered redirect URI for the client app
- `authFrame` -- The iframe element with auth component
- `options` -- Available options
  - `autoRefresh` -- Determines if the activity monitor is used to keep the user's tokens refreshed automatically while the user is active.  (`default: true`)
  - `logLevel` -- The level of logging that is sent to the console (`default: LogLevel.info`)
- `callback` -- A callback method that is called when this action is complete

---


### Register Callback
Registers a callback that will receive all messages from the SSO Broker

```typescript
function registerCallback(id: string, callback: (message: ResponseMessage) => void) {};
```

###### Parameters:
- `id` -- A unique ID that describes the callback function
- `callback` -- A callback that will receive all messages from the SSO Broker

---


### Unregister Callback
Unregisters a callback by its id

```typescript
function unregisterCallback(id: string) {};
```

###### Parameters:
- `id` -- The ID of a registered callback

---


### Authenticate
Checks the current authentication state for the user and will initiate the code flow if required. 

```typescript
function authenticate(
    options: {
        redirect: boolean;
    },
    clientState?: ClientState,
    callback?: (message: ResponseMessage) => void,
) {};
```

###### Parameters:
- `options` -- Authenticate options
    - `redirect` -- Indicates the user should be redirected to the identity broker if not authenticated
- `clientState` -- An object representing any state that should be sent to the broker and returned on redirects
- `callback` -- A callback method that is called when this action is complete

---

### Initiate Code Flow
Starts the Authorization Code Flow process by redirecting the user to the SSO Broker regardless of existing authentication.

```typescript
function initiateCodeFlow(clientState?: ClientState) {};
```

###### Parameters:
- `clientState` -- An object representing any state that should be sent to the broker and returned on redirects

---

### Redeem Code
Exchanges an authentication code for tokens

```typescript
function redeemAuthenticationCode(
    code: string,
    clientState?: ClientState,
    callback?: (message: ResponseMessage) => void,
) {};
```

###### Parameters:
- `clientState` -- An object representing any state that should be sent to the broker and returned on redirects
- `code` -- An authorization code obtained via the `Intitiate Code Flow` process.
- `callback` -- A callback method that is called when this action is complete

---

### Refresh Tokens
Refreshes the users `id` and `access` token using the user's current/valid `refresh` token.

```typescript
function refreshTokens(clientState?: ClientState, callback?: (message: ResponseMessage) => void) {};
```

###### Parameters:
- `clientState` -- An object representing any state that should be sent to the broker and returned on redirects
- `callback` -- A callback method that is called when this action is complete

---


### Logout
Logs the user out of the client application and the SSO Broker

```typescript
function logout(
    options: {
        clientOnly: boolean;
        redirect: boolean;
    },
    clientState: ClientState,
    callback?: (message: ResponseMessage) => void,
) {};
```

###### Parameters:
- `options` -- Logout Options
    - `clientOnly` -- Determines whether the user is logged out of both SSO and the client app, or just the client.
    - `redirect` -- Determines if the user will be redirected to the identity broker if not authenticated
- `clientState` -- An object representing any state that should be sent to the broker and returned on redirects
- `callback` -- A callback method that is called when this action is complete

