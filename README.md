# <a href="https://standupman.xyz"><picture><img src="logo.svg"></picture></a>


**StandUpMan** makes communication easier for teams by allowing team members asynchronously share updates with the team using their medium of choice. *StanupMan* ruthlessly puts at end to **meeting hell** and communication chaos at work thereby making it seamless for everyne to stay updated, improve transparency, work in sync, stay on track, and hit targets in less time.

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
- `npm install`
- `npm run dev` 

# Docs

## OpenAPI
To generate the api spec file run `npm run openapi`
Standupman also comes with swagger interface configured which can be accessed at `/swagger` endpoint through your browser.

# Archictecture 

To run *StandUpMan* the sysadmin must install and configure the webservice and ui. Linking them with their configured hostnames.

## Webservice

*StandUpMan* is built on express and employers the the API First design. The webservice (hosted in the repository) exposes an API which provides services for the UI deleted below.

## UI

StanUpMan's UI is built with [svelte](svelte.dev/) and source is hosted at [standupman-ui](https://github.com/standupman/standupman-ui)

## Setting UP

# Support

Join our community chat rooms on [element](https://matrix.to/#/#standupman:matrix.org) that cover different topics including #bugs, #contributors, #general and more.

# Contributing

Feel free to [open issues](https://github.com/standupman/standupman/issues), submit patches to fix bugs and or improve documentation. Please discuss new features with the maintainers in the contributors room.

## Contributors
<a href="https://github.com/standupman/standupman/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=standupman/standupman" />
</a>

Made with [contributors-img](https://contrib.rocks).

# License

Released under MIT License see [LICENSE](LICENSE.md)

