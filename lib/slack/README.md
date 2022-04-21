# Slack Integration
## Development
If you are contributing, in dev mode please add this line to the slack App:
```js
export const boltApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver,
  port: process.env.PORT || 3000,
  endpoints: '/slack/events',
  deferInitialization: true, // ← this
});
```

This is to bypass initialising the slack app with the need of the secret keys. Otherwise, an `AppInitializationError` will be thrown.

## Slack Installation and Usage Workflow
1. User installs the StandupMan slack app to their specific workspace.
- This is done by redirecting the user to the endpoint `<standupman's domain>/slack/install`

2. Once the user hits the `Allow` button at the site, there is a need to keep track of the installation details. This contains a bot token that is generated uniquely for each slack workspace installation.
- Every time when a user does an action against the StandupMan's slack app, for instance invoking a slash command, it will [query](./app.js#L40) the database for the `installation` object.
- The `installation` object is used to authenticate the current request made.

## KIV
- [OAuth flow](https://github.com/slackapi/bolt-js/issues/1409#issuecomment-1086129659)
- [Enable automatic invoke of the InstallationStore's deleteInstallation function for relevant events](https://github.com/slackapi/bolt-js/issues/1203)
> - This is said to be in the next js bolt release `3.12.0`
> - The current way is to explicitly [code](./app.js#L372) to listen on the `app_uninstalled` event when user uninstalls StandupMan's slack app
- [Reason to store relevant slack workspace (team) id in user model](https://github.com/slackapi/bolt-js/issues/708#issuecomment-782425142)
- Distributing StandupMan's slack app to the official Slack App listing directory `notes`:
  - [Dealing with state](https://github.com/slackapi/bolt-js/issues/390#issuecomment-583207021)