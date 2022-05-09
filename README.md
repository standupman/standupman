# [![StandUpManLogo](./logo.svg)](https://standupman.xyz)

**StandUpMan** makes communication easier for teams by allowing team members asynchronously share updates with the team using their medium of choice. *StanUpMan* ruthlessly puts at end to **meeting hell** and communication chaos at work thereby making it seamless for everyone to stay updated, improve transparency, work in sync, stay on track, and hit targets in less time.

### Can you cut down on those meetings?! 🙄


# Features

- Standup routines [Scheduling]
- Reminders
- Reports
- Integrations

# Installation 

- `git clone https://github.com/Fenn-CS/standupman`
- `cd standupman`
- `cp .env.example .env`
-  Run node node with interactive mode, `node`

## Generating JWT_SECRET
- Run
```js
require('crypto').randomBytes(64).toString('hex')
```

```js
'b522d477d2df5adf4d328875742effa43e88000cf45b05eb2627997c3992fce26b93b2c3724432c2e6904de7c157074062af65f14aa73b7aadd255fccd9d9708'
```
- Set the JWT_SECRET in `.env`
```js
JWT_SECRET_KEY='b522d477d2df5adf4d328875742effa43e88000cf45b05eb2627997c3992fce26b93b2c3724432c2e6904de7c157074062af65f14aa73b7aadd255fccd9d9708'
```
- `npm install`
- `npm run dev` 

# Docs

## OpenAPI
To generate the api spec file run `npm run openapi`
StandUpMan also comes with swagger interface configured which can be accessed at `/swagger` endpoint through your browser.

# Architecture 

To run *StandUpMan* the sysadmin must install and configure the web service and ui. Linking them with their configured host names.

## Web Service

*StandUpMan* is built on express and employers the the API First design. The web service (hosted in the repository) exposes an API which provides services for the UI deleted below.

## UI

StanUpMan's UI is built with [svelte](svelte.dev/) and source is hosted at [standupman-ui](https://github.com/standupman/standupman-ui)

# Setting UP

## Support

Join our community chat rooms on [element](https://matrix.to/#/#standupman:matrix.org) that cover different topics including #bugs, #contributors, #general and more.

## Contributing

Feel free to [open issues](https://github.com/standupman/standupman/issues), submit patches to fix bugs and or improve documentation. Please discuss new features with the maintainers in the contributors room.

## Contributors
<a href="https://github.com/standupman/standupman/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=standupman/standupman" />
</a>

Made with [contributors-img](https://contrib.rocks).

# License

Released under MIT License see [LICENSE](LICENSE.md)

