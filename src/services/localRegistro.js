const fs = require("fs");
const path = require("path");
function getDir() {
return path.join(__dirname, "..", "..", "LOCALREGISTRO");
}
function ensureDir() {
const d = getDir();
if (!fs.existsSync(d)) {
fs.mkdirSync(d, { recursive: true });
}
return d;
}
function weekFilePath(isoYearWeek) {
return path.join(getDir(), `${isoYearWeek}.json`);
}
/**
* Añade un registro de asalto al archivo semanal `LOCALREGISTRO/{isoYearWeek}.json`.
* @returns {string} ruta relativa tipo LOCALREGISTRO/2026-W13.json
*/
function appendAssault(record) {
ensureDir();
const iso = record.isoYearWeek;
const file = weekFilePath(iso);
let list = [];
if (fs.existsSync(file)) {
try {
const raw = fs.readFileSync(file, "utf8");
list = JSON.parse(raw);
if (!Array.isArray(list)) list = [];
} catch {
list = [];
}
}
list.push(record);
fs.writeFileSync(file, JSON.stringify(list, null, 2), "utf8");
return `LOCALREGISTRO/${iso}.json`;
}
function readWeek(isoYearWeek) {
const file = weekFilePath(isoYearWeek);
if (!fs.existsSync(file)) return [];
try {
const list = JSON.parse(fs.readFileSync(file, "utf8"));
return Array.isArray(list) ? list : [];
} catch {
return [];
}
}
module.exports = {
getDir,
appendAssault,
readWeek,
weekFilePath,
};
