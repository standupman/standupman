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

  app_home_opened: (slackUser) => {
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
    return view;
  },
};

export default views;
