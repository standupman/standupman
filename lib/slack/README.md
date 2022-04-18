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

This is to bypass initialising the slack app with the need of the secret keys. Otherwise, an authentication error will be thrown.