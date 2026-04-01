const { ActivityType } = require("discord.js");
require("colors");
module.exports = {
name: "clientReady",
once: true,
async execute(client) {
console.info(`Bot encendido como: ${client.user.tag}`.green.bold);
await require("../../Handlers/slashHandler").loadSlash(client);

client.user.setPresence({
activities: [{
name: "Real RP",
type: ActivityType.Playing,
}],
status: "online"
});

console.log("Rich Presence establecido".yellow);
},
};
