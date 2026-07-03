import { servers } from "../servers.js";
import { users } from "../users.js";

export default {
  name: "servers",
  description: "list all linked servers",
  usage: "servers",
  async execute(message) {

    if (users.some(u => u.id === message.author.id && u.admin === 1)) {
      const content = servers.map(s => {
        return `**${s.name}**: <#${s.channelId}>: ${s.id} `;
      }).join("\n");

      if (content.length === 0) {
        return message.reply("No servers are linked.");
      }
      message.reply(content);
    }

  },
};
