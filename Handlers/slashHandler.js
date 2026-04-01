const fs = require("fs");
const path = require("path");
require("colors");
const ROOT = path.join(__dirname, "..");
module.exports = {
async loadSlash(client) {
const commands = [];
for (const category of fs.readdirSync(path.join(ROOT, "SlashCommands"))) {
const files = fs
.readdirSync(path.join(ROOT, "SlashCommands", category))
.filter((file) => file.endsWith(".js"));
for (const file of files) {
const command = require(path.join(ROOT, "SlashCommands", category, file));
client.slashCommands.set(command.data.name, command);
commands.push(command.data.toJSON());
}
}
await client.application.commands.set(commands);
console.info(
`✅ ${commands.length} comandos slash registrados de forma **global**.`.green.bold,
);
console.info(
"ℹ️  Los cambios pueden tardar unos minutos en aplicarse en Discord.".yellow,
);
},
};
