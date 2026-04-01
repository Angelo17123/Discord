const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getRanking, resolveWeekQuery, getWeekNumber } = require("../../src/services/assaultPersistence");
function formatRankingLine(i, entry) {
const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
return `${medal} **${entry.count}** — <@${entry.userId}>`;
}
function formatDetailedRankingLine(i, entry) {
const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
let text = `${medal} **${entry.count}** — <@${entry.userId}>\n`;
if (entry.assaults.length > 0) {
const details = entry.assaults.slice(-5).map(a => `  ${a.tipo || '⚔️'} ${a.sede}: ${a.winner} (${a.score}) - ${a.fecha}`).join("\n");
text += details;
}
return text;
}
module.exports = {
data: new SlashCommandBuilder()
.setName("ranking_asaltos")
.setDescription("Ver ranking de quién realizó más eventos (asaltos, BR, Rey del Crimen).")
.addStringOption((o) =>
o
.setName("semana")
.setDescription("Vacío o 0 = semana actual. 13 = semana 13 del año. O 2026-W13")
.setRequired(false),
)
.addBooleanOption((o) =>
o
.setName("detallado")
.setDescription("Ver detalles de cada evento (últimos 5)")
.setRequired(false),
)
.setDefaultMemberPermissions(1n << 3n),
async execute(interaction) {
await interaction.deferReply({ flags: MessageFlags.Ephemeral });
try {
const raw = interaction.options.getString("semana");
const week = resolveWeekQuery(raw);
const weekNum = getWeekNumber(new Date(week.replace('-W', '-01')));
const detallado = interaction.options.getBoolean("detallado") || false;
const ranking = getRanking(week);
if (!ranking.length) {
return interaction.editReply({
content: `No hay eventos registrados en la **Semana ${weekNum}**.`,
});
}
const lines = ranking.slice(0, 20).map((entry, i) =>
detallado ? formatDetailedRankingLine(i, entry) : formatRankingLine(i, entry)
);
const embed = new EmbedBuilder()
.setTitle(`🏆 Ranking Semana ${weekNum}${detallado ? " (Detallado)" : ""}`)
.setColor(detallado ? 0x00FF00 : 0xFFD700)
.setDescription(lines.join("\n").slice(0, 6000))
.setFooter({ text: `${ranking.length} usuario(s) con eventos` });
return interaction.editReply({ embeds: [embed] });
} catch (err) {
console.error("ranking_asaltos:", err);
return interaction.editReply({
content: `❌ Error al leer el ranking: \`${err.message}\``,
});
}
},
};
