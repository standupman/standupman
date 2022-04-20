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

## Note
- Current [slack installation](./app.js#L13) only supports `single team app installation`

## KIV
- [OAuth flow](https://github.com/slackapi/bolt-js/issues/1409#issuecomment-1086129659)
- [Enable automatic invoke of the InstallationStore's deleteInstallation function for relevant events](https://github.com/slackapi/bolt-js/issues/1203)
> - This is said to be in the next js bolt release `3.12.0`
> - The current way is to explicitly [code](./app.js#L344) to listen on the `app_uninstalled` event when user uninstalls StandupMan's slack app
- [Reason to store relevant slack workspace (team) id in user model](https://github.com/slackapi/bolt-js/issues/708#issuecomment-782425142)