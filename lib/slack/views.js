const views = {
  modal_view: (slackUserId) => {
    const view = {
      type: 'modal',
      callback_id: 'modal_post',
      title: {
        type: 'plain_text',
        text: 'Standup Responses',
        emoji: true,
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: `Hey <@${slackUserId}> :wave:! Submit your standup responses through here!`,
            emoji: true,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          block_id: 'standup_select',
          text: {
            type: 'mrkdwn',
            text: 'Standup to post response: ',
          },
          accessory: {
            type: 'static_select',
            placeholder: {
              type: 'plain_text',
              text: 'Select an standup',
              emoji: true,
            },
            options: [],
            action_id: 'standup_list',
          },
        },
      ],
      close: {
        type: 'plain_text',
        text: 'Cancel',
      },
    };
    return view;
  },

  app_home_opened: (slackUser, type = null) => {
    const view = {
      type: 'home',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Welcome, <@${slackUser}> :leaves:*`,
          },
        },
      ],
    };

    if (type === 'no_user') {
      const { text } = view.blocks[0].text;
      view.blocks[0].text.text = `${text} thank you for your interest in `
        + 'StandupMan!\n You will need an account with us to use '
        + "StandupMan's service. Visit us at standupman.xyz to sign "
        + 'up :hugging_face:';
    } else if (type === 'no_auth') {
      view.blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'verify to receive standup reminders in the current slack '
                  + 'workspace from StandupMan\'s slack app bot',
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Verify',
              emoji: true,
            },
            action_id: 'auth_btn',
          },
        },
      );
    } else {
      view.blocks.push(
        {
          type: 'context',
          elements: [
            {
              type: 'plain_text',
              text: 'Verified',
            },
          ],
        },
      );
    }

    return view;
  },

  notify_user: (slackUserId) => {
    const text = {
      no_acc: `Hey <@${slackUserId}>, thank you for your interest in `
              + 'StandupMan!\n You will need an account with us to use '
              + 'StandupMan\'s service. Visit us at standupman.xyz to sign '
              + 'up :hugging_face:',
      no_sub: `<@${slackUserId}> you are currently not subscribed to any `
                + 'standups. Visit standupman.xyz to get started :bulb:',
    };

    return text;
  },
};

export default views;
