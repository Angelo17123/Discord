const path = require("path");
const { readdirSync } = require("fs");
require("colors");
const ROOT = path.join(__dirname, "..");
module.exports = {
async loadEvents(client) {
let cantidadEventos = 0;
readdirSync(path.join(ROOT, "Events")).forEach((folder) => {
readdirSync(path.join(ROOT, "Events", folder))
.filter((file) => file.endsWith(".js"))
.forEach((file) => {
const event = require(path.join(ROOT, "Events", folder, file));
if (event.once) {
client.once(event.name, (...args) =>
event.execute(...args, client),
);
} else {
client.on(event.name, (...args) => event.execute(...args, client));
}
cantidadEventos++;
});
});
console.info(
`✅ ${cantidadEventos} eventos cargados correctamente.`.green.bold,
);
},
};
