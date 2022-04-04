/* eslint-disable object-shorthand */
/* eslint-disable no-underscore-dangle */
import { DateTime } from 'luxon';
import slackpkg from '@slack/bolt';

import User from '../../Models/User';
import StandUp from '../../Models/StandUp';
import StandUpUpdate from '../../Models/StandUpUpdate';
import views from './views';

const { App, ExpressReceiver } = slackpkg;

export const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Initialise Slack App
export const boltApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver,
  port: process.env.PORT || 3000,
  endpoints: '/slack/events',
});

// listen for a slash command invocation
boltApp.command('/standup-notes', async ({
  ack, body, client, command, logger,
}) => {
  await ack();

  try {
    const userEmail = (await client.users.info({ user: body.user_id })).user
      .profile.email;
    const users = await User.find({ email: userEmail }).lean();

    if (users.length === 0) {
      client.chat.postMessage({
        channel: body.user_id,
        text: `Hey <@${body.user_id}>Thank you for your interest in StandupMan!\n You will need an account with us to use StandupMan's service. Visit us at standupman.xyz to sign up :hugging_face:`,
      });
    } else if (users[0].standups.length === 0) {
      client.chat.postMessage({
        channel: body.user_id,
        text: `<@${body.user_id}> you are currently not subscribed to any standups. Visit standupman.xyz to get started :bulb:`,
      });
    } else {
      const { standups } = users[0];
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

// user invoke action from modal
boltApp.action('standup_list', async ({
  ack, body, client, logger,
}) => {
  await ack();

  try {
    const userEmail = (await client.users.info({ user: body.user.id })).user
      .profile.email;
    const users = await User.find({ email: userEmail }).lean();

    const standup = await StandUp.findById({
      _id: body.actions[0].selected_option.value,
    }).lean();
    const standupQns = await StandUpUpdate.findOne({
      standup_id: standup._id,
      user_id: users[0]._id,
    }).lean();

    const blockUpdate = views.modal_view(body.user.username);
    blockUpdate.blocks[2].accessory.options = body.view.blocks[2].accessory.options;

    blockUpdate.submit = {
      type: 'plain_text',
      text: 'Submit',
    };

    if (
      standupQns == null
      || standupQns.responseTime.getDate() !== DateTime.utc().day
    ) {
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
          text: `You have already posted for today's ${body.actions[0].selected_option.text.text} standup!`,
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
  const user = await User.find({
    email: (await client.users.info({ user: userId })).user.profile.email,
  }).lean();

  const payload = view.state.values;
  const formatResponse = {
    standup_id:
      payload.standup_select.standup_list.selected_option.value,
    user_id: user[0]._id,
    responseTime: new Date(),
    answers: {},
  };

  delete payload.standup_select;
  const keys = Object.keys(payload);
  keys.forEach((res, idx) => {
    let index = idx;
    formatResponse.answers[`answer_${index += 1}`] = {
      question_id: res,
      response: payload[res][`a_id_${res}`].value,
    };
  });

  console.log('This is formatResponse: ', formatResponse);

  let msg = '';
  const results = await StandUpUpdate.create(formatResponse);
  console.log('This is results: ', results);
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

boltApp.event('app_home_opened', async ({ event, client, logger }) => {
  try {
    await client.views.publish({
      user_id: event.user,
      view: views.app_home_opened(event.user),
    });
  } catch (error) {
    logger.error(error);
  }
});
