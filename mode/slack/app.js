import User from "../../Models/User.js";
import StandUp from "../../Models/StandUp.js";
import StandUpUpdate from "../../Models/StandUpUpdate.js";
import { views } from "./views.js";

import { DateTime } from "luxon";
import slackpkg from "@slack/bolt";


const { App, ExpressReceiver } = slackpkg;

export const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Initialise Slack App
export const boltApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver,
  port: process.env.PORT || 3000,
  endpoints: '/slack/events'
});

// listen for a slash command invocation
boltApp.command(
  "/standup-notes",
  async ({ ack, body, client, command, logger }) => {
    await ack();

    try {
      const userEmail = (await client.users.info({ user: body["user_id"] }))
        .user.profile.email;
      const users = await User.find({ email: userEmail }).lean();

      if (users.length == 0) {
        client.chat.postMessage({
          channel: body["user_id"],
          text: `Hey <@${body["user_id"]}>Thank you for your interest in StandupMan!\n You will need an account with us to use StandupMan's service. Visit us at standupman.xyz to sign up :hugging_face:`,
        });
      } else if (users[0].standups.length == 0) {
        client.chat.postMessage({
          channel: body["user_id"],
          text: `<@${body["user_id"]}> you are currently not subscribed to any standups. Visit standupman.xyz to get started :bulb:`,
        });
      } else {
        const standups = users[0]["standups"];
        const view = views.modal_view(body["user_name"]);
        
        if (command.text == "post") {
          // 
          let view_options = await Promise.all(
            standups.map(async (standupid) => {
              let standup = await StandUp.findById({ _id: standupid }).lean();
              return {
                text: {
                  type: "plain_text",
                  text: standup["name"],
                  emoji: true,
                },
                value: standup["_id"],
              };
            })
          );
        
          view["blocks"][2]["accessory"]["options"] = view_options;

          await client.views.open({
            trigger_id: body.trigger_id,
            view: view,
          });
        }
      }
    } catch (error) {
      logger.error("Error opening modal view: ", error.message);
    }
  }
);

// user invoke action from modal
boltApp.action("standup_list", async ({ ack, body, client, logger }) => {
  await ack();

  try {
    const userEmail = (await client.users.info({ user: body.user.id })).user
      .profile.email;
    const users = await User.find({ email: userEmail }).lean();

    let standup = await StandUp.findById({
      _id: body.actions[0].selected_option.value,
    });
    var standup_qns = await StandUpUpdate.findOne({
      standup_id: standup._id,
      user_id: users[0]["_id"],
    }).lean();

    const block_update = views.modal_view(body.user.username);
    block_update.blocks[2].accessory.options =
      body.view.blocks[2].accessory.options;
    
      block_update["submit"] = {
      type: "plain_text",
      text: "Submit",
    }
      
    if (
      standup_qns == null ||
      standup_qns.responseTime.getDate() != DateTime.now().toUTC().get('day')
    ) {
      for (let question in standup["questions"]) {
        block_update["blocks"].push({
          block_id: question,
          type: "input",
          label: {
            type: "plain_text",
            text: standup["questions"][question]["title"],
            emoji: true,
          },
          element: {
            type: "plain_text_input",
            multiline: true,
            action_id: "a_id_" + question,
          },
        });
      }
    } else {
      block_update["blocks"].push({
        type: "section",
        text: {
          type: "plain_text",
          text: `You have already posted for today's ${body.actions[0].selected_option.text.text} standup!`,
          emoji: true,
        },
      });
    }

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: block_update,
    });
  } catch (error) {
    logger.error(error);
  }
});

boltApp.view("modal_post", async ({ ack, body, view, client, logger }) => {
  // Acknowledge the view_submission request
  await ack();

  const userId = body.user.id;
  const user = await User.find({
    email: (await client.users.info({ user: userId })).user.profile.email,
  });

  const payload = view.state.values;
  const format_response = {
    standup_id:
      payload["standup_select"]["standup_list"]["selected_option"]["value"],
    user_id: user[0]["_id"],
    responseTime: new Date(),
    answers: {},
  };

  delete payload.standup_select;
  const keys = Object.keys(payload);
  keys.forEach((res, idx) => {
    format_response["answers"]["answer_" + ++idx] = {
      question_id: res,
      response: payload[res]["a_id_" + res]["value"],
    };
  });

  let msg = "";
  const results = await StandUpUpdate.create(format_response);
  if (results) {
    msg = "Your submission was successful :tada:";
  } else {
    msg = "There was an error with your submission";
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

boltApp.event("app_home_opened", async ({ event, client, logger }) => {
  try {
    await client.views.publish({
      user_id: event.user,
      view: views.app_home_opened(event.user)
    });
  } catch (error) {
    logger.error(error);
  }
});
