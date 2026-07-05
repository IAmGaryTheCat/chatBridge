import { WebhookClient } from "discord.js";
import Logger from "garylog";

import { client } from "./client.js";
import { removeServer, servers } from "./servers.js";
import { addUser, updateUsername, users } from "./users.js";
import { getAuthorUsernameFromMessage, filterMessage } from "./utils.js";
import { recordMessageBridge } from "./messageLog.js";
import { PREFIX } from "./utils.js";

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith(PREFIX)) return;
  if (!users.some(u => u.id === message.author.id)) {
    const name = getAuthorUsernameFromMessage(message);
    addUser(message.author.id, name);
  }

  if (users.some(u => u.id === message.author.id && u.username !== getAuthorUsernameFromMessage(message))) {
    const index = users.findIndex(u => u.id === message.author.id);
    users[index].username = getAuthorUsernameFromMessage(message);
    await updateUsername(message.author.id, users[index].username);
  }

  if (users.some(u => u.id === message.author.id && u.banned === 1)) {
    return;
  }
  if (servers.some(s => s.channelId === message.channel.id)) {
    let replyText = "";

    if (message.reference) {
      try {
        const referenced = await message.fetchReference();
        const replyAuthor = referenced.member?.displayName || referenced.author.username;
        let rawContent = referenced.content || "[embed/attachment]";
        const cleanedContent = rawContent.replace(/^`Replying to @.*?: ".*?"`\n?/s, "").trim();
        let replyContent = cleanedContent.slice(0, 100);

        replyContent = await filterMessage(replyContent);

        replyText = `\`Replying to @${replyAuthor}: "${replyContent}"\``;
      } catch (err) {
        Logger.warn("Failed to fetch reply reference:", err);
      }
    }

    let totalAttachmentSize = 0;
    message.attachments.forEach(att => {
      if (att.size) totalAttachmentSize += att.size;
    });
    if (totalAttachmentSize > 8388608) {
      Logger.warn(`Message from ${message.author.id} blocked: attachments exceed 8MB total.`);
      return;
    }

    for (const server of servers) {
      if (server.channelId === message.channel.id) continue;

      const webhookClient = new WebhookClient({ url: server.webhook });

      let filteredContent = await filterMessage(message.content);

      const name = getAuthorUsernameFromMessage(message);
      const shitStickers = message.stickers?.filter(s => s.type !== 1 && !s.url.endsWith('.json')).map(s => s.url) || [];
      const webhookFiles = message.attachments.map(att => att.url);
      let finalContent = `${replyText}\n${filteredContent}`;
      
      if (shitStickers.length > 0) {
        finalContent += `\n${shitStickers.join('\n')}`;
      }

      if (!finalContent.trim() && webhookFiles.length === 0) {
        continue;
      }

      webhookClient.send({
        content: finalContent.trim() || undefined,
        username: name,
        avatarURL: message.author.displayAvatarURL(),
        files: webhookFiles,
      }).then((sentMessage) => {
        recordMessageBridge(message.id, message.channel.id, server.channelId, sentMessage.id);
      }).catch(async (err) => {
        Logger.error("Failed to send webhook for server: " + (server.name || "Unknown") + " (ID: " + server.id + ")");
        if (err.code === 10015 || err.code === 50027) {
          await removeServer(server.id);
        }
      });
    }
  }
});

client.on("guildDelete", async (guild) => {
  await removeServer(guild.id);
});
