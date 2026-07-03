import { client } from "../client.js";



export default {
    name: "help",
    description: "list all commands",
    usage: "help",
    async execute(message) {
        const commands = client.textCommands.map(command => {
            return `**${command.name}**: ${command.description} \nUsage: ${command.usage}`;
        }).join("\n\n");

        message.reply(commands);


    },
};