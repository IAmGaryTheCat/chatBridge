import { removeServer } from "../servers.js";

export default {
  name: "unlink",
  description: "unlink the current channel from the bridge",
  usage: "unlink",
  async execute(message) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("You need to be an administrator to use this command.");
    }

    await removeServer(message.guild.id);

    message.reply("Channel unlinked successfully!");
  },
};
