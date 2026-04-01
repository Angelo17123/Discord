const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const PostgresMatchRepository = require("../../src/infrastructure/database/postgres/PostgresMatchRepository");
const { resolveWeekQuery, getWeekNumber } = require("../../src/services/assaultPersistence");
function formatLine(i, r) {
const tipo = r.event_subtype === 'rey_del_crimen' ? '👑' :
             r.event_subtype === 'br_cayo' ? '🏝️' :
             r.event_subtype === 'br_ciudad' ? '🏢' :
             r.event_subtype === 'bicicleta' ? '🚲' : '⚔️';
const sub = r.event_subtype ? ` · ${r.event_subtype}` : "";
const sede = r.sede_name;
const def = r.def_name;
const atk = r.atk_name;
const w = r.winner_name;
const sd = r.score_def;
const sa = r.score_atk;
const fecha = r.fecha || "N/A";
const creador = r.creatorId ? `<@${r.creatorId}>` : "Desconocido";
const apoyo = r.staffApoyo && r.staffApoyo.length > 0
? `Apoyo: ${r.staffApoyo.map(id => `<@${id}>`).join(", ")}`
: "";
let line = `${i + 1}. ${tipo} **${sede}**${sub}\n`;
line += `   👤 Creador: ${creador}\n`;
line += `   📅 Fecha: ${fecha}\n`;
line += `   ⚔️ ${def} **${sd}-${sa}** ${atk} · 🏆 ${w}`;
if (apoyo) line += `\n   ${apoyo}`;
return line;
}
module.exports = {
data: new SlashCommandBuilder()
.setName("historial_asaltos")
.setDescription("Lista eventos por semana (asaltos, BR, Rey del Crimen).")
.addStringOption((o) =>
o
.setName("semana")
.setDescription("Vacío o 0 = semana actual. 13 = semana 13 del año. O 2026-W13")
.setRequired(false),
)
.setDefaultMemberPermissions(1n << 3n),
async execute(interaction) {
await interaction.deferReply({ flags: MessageFlags.Ephemeral });
try {
const raw = interaction.options.getString("semana");
const week = resolveWeekQuery(raw);
const weekNum = getWeekNumber(new Date(week.replace('-W', '-01')));
let rows = await PostgresMatchRepository.getMatchesByIsoYearWeek(week);
if (!rows.length) {
return interaction.editReply({
content: `No hay eventos registrados para la **Semana ${weekNum}**.`,
});
}
const lines = rows.slice(0, 15).map((r, i) => formatLine(i, r));
const embed = new EmbedBuilder()
.setTitle(`📋 Eventos — Semana ${weekNum}`)
.setColor(0x2b2d31)
.setDescription(lines.join("\n").slice(0, 6000))
.setFooter({ text: `${rows.length} registro(s) · JSON DB` });
return interaction.editReply({ embeds: [embed] });
} catch (err) {
console.error("historial_asaltos:", err);
return interaction.editReply({
content: `❌ Error al leer el historial: \`${err.message}\``,
});
}
},
};
