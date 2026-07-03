import { client } from "../client.js";
import { adminUser } from "../users.js";
import { USERID, PREFIX } from "../utils.js";

export default {
  name: "admin",
  description: "give admin rights to a user",
  usage: "admin <@user>",
  async execute(message, args) {
    if (message.author.id.toString() !== USERID) {
      return message.reply("You do not have permission to use this command.");
    }

    if (args.length < 1) {
      return message.reply(`Usage: ${PREFIX}admin <@user>`);
    }
    const userText = args[0];
    if (!/^<@!?(\d+)>$/.test(userText)) {
      return message.reply("Please provide a valid user mention.");
    }

    const userId = userText.replace(/^<@!?(\d+)>$/, "$1");
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) {
      return message.reply("User not found.");
    }
    await adminUser(userId);
    message.reply(`User ${user.username} has been granted admin rights.`);

  },
};
