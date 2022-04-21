/* eslint-disable object-shorthand */
/* eslint-disable no-underscore-dangle */
import { DateTime } from 'luxon';
import slackpkg from '@slack/bolt';

import User from '../../Models/User';
import StandUp from '../../Models/StandUp';
import StandUpUpdate from '../../Models/StandUpUpdate';
import SlackInstallation from '../../Models/SlackInstallation';
import views from './views';

const { App, ExpressReceiver } = slackpkg;

const authinstallationStore = {
  storeInstallation: async (installation) => {
    async function storeIns(id) {
      const existsInstall = await SlackInstallation.findById(id);

      if (existsInstall !== null) {
        await SlackInstallation.findByIdAndUpdate(
          existsInstall._id,
          {
            $set: { installation: installation },
          },
          { new: true },
        );
      }
      if (installation.team !== undefined && existsInstall === null) {
        await SlackInstallation.create({
          _id: id,
          installation: installation,
        });
      }
    }

    if (
      installation.isEnterpriseInstall
      && installation.enterprise !== undefined
    ) {
      return storeIns(installation.enterprise.id);
    }
    if (installation.team !== undefined) {
      return storeIns(installation.team.id);
    }

    throw new Error('Failed saving installation data to installationStore');
  },

  fetchInstallation: async (installQuery) => {
    async function fetchIns(id) {
      const fetch = await SlackInstallation.findById(id).lean();
      return fetch.installation;
    }

    if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
      return fetchIns(installQuery.enterpriseId);
    }
    if (installQuery.teamId !== undefined) {
      return fetchIns(installQuery.teamId);
    }
    throw new Error('Failed fetching installation');
  },

  deleteInstallation: async (installQuery) => {
    async function deleteIns(id) {
      await SlackInstallation.findByIdAndDelete(id);
    }

    if (
      installQuery.isEnterpriseInstall
      && installQuery.enterpriseId !== undefined
    ) {
      return deleteIns(installQuery.enterpriseId);
    }
    if (installQuery.team_id !== undefined) {
      return deleteIns(installQuery.team_id);
    }
    throw new Error('Failed to delete installation');
  },
};

export const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: [
    'app_mentions:read',
    'channels:history',
    'channels:read',
    'chat:write',
    'commands',
    'groups:history',
    'im:history',
    'im:write',
    'mpim:history',
    'users:read',
    'users:read.email',
  ],
  installerOptions: {
    userScopes: [
      'channels:history',
      'groups:history',
      'im:history',
      'mpim:history',
    ],
    directInstall: true,
  },
  installationStore: authinstallationStore,
});

// Initialise Slack App
export const boltApp = new App({
  receiver: expressReceiver,
  port: process.env.PORT || 3000,
  endpoints: '/slack/events',
});

// Handle post standup notes
boltApp.command('/standup-notes', async ({
  ack, body, client, command, logger,
}) => {
  await ack();

  try {
    const userEmail = (await client.users.info({ user: body.user_id })).user
      .profile.email;
    const user = await User.findOne({ email: userEmail }).lean();

    if (user === null) {
      client.chat.postMessage({
        channel: body.user_id,
        text: views.notify_user(body.user_id).no_acc,
      });
    } else if (user.standups.length === 0) {
      client.chat.postMessage({
        channel: body.user_id,
        text: views.notify_user(body.user_id).no_sub,
      });
    } else {
      const { standups } = user;
      const view = views.modal_view(body.user_name);

      if (command.text === 'post') {
        const viewOptions = await Promise.all(
          standups.map(async (standupid) => {
            const standup = await StandUp.findById({ _id: standupid }).lean();
            return {
              text: {
                type: 'plain_text',
                text: standup.name,
                emoji: true,
              },
              value: standup._id,
            };
          }),
        );

        view.blocks[2].accessory.options = viewOptions;

        await client.views.open({
          trigger_id: body.trigger_id,
          view: view,
        });
      }
    }
  } catch (error) {
    logger.error('Error opening modal view: ', error.message);
  }
});

boltApp.action('standup_list', async ({
  ack, body, client, logger,
}) => {
  await ack();

  try {
    const userEmail = (await client.users.info({ user: body.user.id })).user
      .profile.email;
    const user = await User.findOne({ email: userEmail }).lean();

    const standup = await StandUp.findById({
      _id: body.actions[0].selected_option.value,
    }).lean();
    const standupQns = await StandUpUpdate.findOne({
      standup_id: standup._id,
      user_id: user._id,
    }).lean();

    const blockUpdate = views.modal_view(body.user.username);
    blockUpdate.blocks[2].accessory.options = body.view.blocks[2].accessory.options;

    if (
      standupQns == null
      || standupQns.responseTime.getUTCDate() !== DateTime.utc().day
    ) {
      blockUpdate.submit = {
        type: 'plain_text',
        text: 'Submit',
      };

      Object.keys(standup.questions).forEach((question) => {
        blockUpdate.blocks.push({
          block_id: question,
          type: 'input',
          label: {
            type: 'plain_text',
            text: standup.questions[question].title,
            emoji: true,
          },
          element: {
            type: 'plain_text_input',
            multiline: true,
            action_id: `a_id_${question}`,
          },
        });
      });
    } else {
      blockUpdate.blocks.push({
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'You have already posted for today\'s '
                + `${body.actions[0].selected_option.text.text} standup!`,
          emoji: true,
        },
      });
    }

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: blockUpdate,
    });
  } catch (error) {
    logger.error(error);
  }
});

boltApp.view('modal_post', async ({
  ack, body, view, client, logger,
}) => {
  // Acknowledge the view_submission request
  await ack();

  const userId = body.user.id;
  const user = await User.findOne({
    email: (await client.users.info({ user: userId })).user.profile.email,
  }).lean();

  const payload = view.state.values;
  const formatResponse = {
    standup_id:
      payload.standup_select.standup_list.selected_option.value,
    user_id: user._id,
    responseTime: DateTime.utc(),
    answers: {},
  };

  delete payload.standup_select;
  const keys = Object.keys(payload);
  keys.forEach((res, idx) => {
    formatResponse.answers[`answer_${idx + 1}`] = {
      question_id: res,
      response: payload[res][`a_id_${res}`].value,
    };
  });

  let msg = '';
  const results = await StandUpUpdate.create(formatResponse);
  if (results) {
    msg = 'Your submission was successful :tada:';
  } else {
    msg = 'There was an error with your submission';
  }

  try {
    await client.chat.postMessage({
      channel: userId,
      text: msg,
    });
  } catch (error) {
    logger.error(error);
  }
});

// Handle authenticating user
boltApp.event('app_home_opened', async ({ event, client, logger }) => {
  const userEmail = (await client.users.info({ user: event.user })).user.profile
    .email;
  const user = await User.findOne({ email: userEmail })
    .select('configs.notification')
    .lean();
  const auth = await client.auth.test();

  let view;

  if (user === null) {
    view = views.app_home_opened(event.user, 'no_user');
  } else if (
    user.configs.notification.slack_id === undefined
    || auth.team_id !== user.configs.notification.slack_id) {
    view = views.app_home_opened(event.user, 'no_auth');
    view.blocks[1].accessory.value = auth.team_id;
  } else {
    view = views.app_home_opened(event.user);
  }

  try {
    await client.views.publish({
      user_id: event.user,
      view: view,
    });
  } catch (error) {
    logger.error(error);
  }
});

boltApp.action('auth_btn', async ({
  ack, body, client, logger,
}) => {
  await ack();

  try {
    const userEmail = (await client.users.info({ user: body.user.id })).user
      .profile.email;
    const user = await User.findOne({ email: userEmail })
      .select('configs.notification');

    if (user.configs.notification.destination !== 'slack') {
      const auth = await client.auth.test();
      const view = views.app_home_opened(body.user.id, 'no_auth');

      view.blocks[1].accessory.value = auth.team_id;
      view.blocks.push(
        {
          type: 'context',
          elements: [
            {
              type: 'plain_text',
              text: 'Verification failed. Please visit standupman.xyz to '
                    + 'ensure that in the user settings \'slack\' is selected '
                    + 'as the preferred method to receive notification.',
            },
          ],
        },
      );

      await client.views.publish({
        user_id: body.user.id,
        view: view,
      });
    } else {
      user.configs.notification.slack_id = body.actions[0].value;
      user.save();

      await client.views.publish({
        user_id: body.user.id,
        view: views.app_home_opened(body.user.id, 'authed'),
      });
    }
  } catch (error) {
    logger.error(error);
  }
});

// Handle uninstallation of app
boltApp.event('app_uninstalled', async ({ body }) => {
  authinstallationStore.deleteInstallation(body);
});
