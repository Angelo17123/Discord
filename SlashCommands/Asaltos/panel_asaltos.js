const { SlashCommandBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { getRanking, getRankingMensual, getMonthString, getWeeksInMonth, getWeekNumber } = require('../../src/services/assaultPersistence');
module.exports = {
data: new SlashCommandBuilder()
.setName('panel_asaltos')
.setDescription('Inicializa la gestión de eventos y asaltos.')
.setDefaultMemberPermissions(1n << 3n),
async execute(interaction) {
const embed = new EmbedBuilder()
.setTitle('🛡️ GESTIÓN DE EVENTOS Y ASALTOS')
.setColor(0x2b2d31)
.setDescription(`Selecciona el tipo de actividad que deseas organizar. Todo está automatizado para máxima eficiencia.\n\n🛡️ **Asalto a Sede** (Clásico 15v15 / 20v20)\n✨ **Eventos Especiales** (Bicicleta, Duelos, Dinámicas)\n🏢 **Eventos Masivos** (BR Ciudad, Cayo, Rey del Crimen)`)
.setFooter({ text: 'Bot Entretenimiento • Sistema de Entretenimiento' });
const row1 = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId('btn_registrar_asalto').setLabel('✨ Registrar Asalto').setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId('btn_registrar_duelo').setLabel('🚀 Registrar Evento').setStyle(ButtonStyle.Primary)
);
const row2 = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId('btn_br_ciudad_iniciar').setLabel('🏢 BR Ciudad').setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId('btn_br_cayo_iniciar').setLabel('🏝️ BR Cayo').setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId('btn_rey_crimen_iniciar').setLabel('👑 Rey del Crimen').setStyle(ButtonStyle.Secondary)
);
const currentWeek = getWeekNumber();
const currentMonth = getMonthString();
const row3 = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId('btn_ranking_semana').setLabel(`📅 Semana ${currentWeek}`).setStyle(ButtonStyle.Danger),
new ButtonBuilder().setCustomId('btn_ranking_mes').setLabel(`📆 ${currentMonth}`).setStyle(ButtonStyle.Danger),
new ButtonBuilder().setCustomId('btn_buscar_semana').setLabel('🔍 Buscar Semana').setStyle(ButtonStyle.Secondary)
);
await interaction.reply({
embeds: [embed],
components: [row1, row2, row3]
});
}
};
