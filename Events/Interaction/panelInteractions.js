const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder, MessageFlags } = require('discord.js');
const sessionManager = require('../../managers/sessionManager');
const PostgresSedesRepository = require('../../src/infrastructure/database/postgres/PostgresSedesRepository');
const PostgresMatchRepository = require('../../src/infrastructure/database/postgres/PostgresMatchRepository');
const PostgresFaccionesRepository = require('../../src/infrastructure/database/postgres/PostgresFaccionesRepository');
const EMOJIS = require('../../src/constants/emojis');
const assaultPersistence = require('../../src/services/assaultPersistence');
const path = require('path');
const fs = require('fs');
async function getFaccionesBr() {
  const rows = await PostgresFaccionesRepository.getAllBr();
  const map = {};
  for (const r of rows) {
    map[r.key] = { nombre: r.nombre, emoji: EMOJIS.faccionesBr[r.key] || '', coords: r.coords, coords_br_ciudad: r.coords_br_ciudad, coords_br_cayo: r.coords_br_cayo, coords_br_rey: r.coords_br_rey };
  }
  return map;
}
const finalMessages = [
(sede, win, lose) => `🔥 CAOS Y GLORIA EN ${sede} 🔥\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n🏆 VICTORIA APLASTANTE DE ${win}\nEntraron, ejecutaron y dominaron. Una exhibición de fuerza y jerarquía.\nEl rival no tuvo respuesta ante tal despliegue de poder. 👑 💪\n\n⚔️ ${lose} RESISTIÓ\nA pesar de la tormenta, se mantuvieron firmes hasta el último aliento.\nHoy no fue su día, pero la guerra continúa.\n\n✨ El polvo se asienta y solo un nombre resuena:\n${win}. La historia la escriben los vencedores.`,
(sede, win, lose) => `🔥 ASALTO A SEDE EN ${sede} 🔥\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n🏆 VICTORIA ABSOLUTA DE ${win}\nLa estrategia y el plomo hablaron por sí solos. Un asalto impecable.\nNadie pudo detener el avance de sus fuerzas. 👑 💥\n\n⚔️ ${lose} CAYÓ CON HONOR\nLucharon cada centímetro de la sede, pero la balanza se inclinó en su contra.\nLa venganza se servirá fría en el próximo encuentro.\n\n✨ Las calles tienen un nuevo dueño hoy:\n${win}. Respeto y poder conquistado.`,
(sede, win, lose) => `🔥 INFIERNO DESATADO EN ${sede} 🔥\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n🏆 ${win} RECLAMA EL TRONO\nUna demostración de poder puro. Arrasaron con cualquier resistencia en su camino.\nEl control total ha sido asegurado. 👑 🔫\n\n⚔️ ${lose} DIO LA CARA\nNo hubo rendición, solo una derrota ante un enemigo implacable.\nLas heridas sanarán, pero el orgullo exige revancha.\n\n✨ El eco de los disparos se desvanece y el veredicto es claro:\n${win}. Los reyes absolutos de la sesión.`
];
const eventFinalMessages = [
(sede, win, lose) => `🔥 DOMINIO TOTAL EN ${sede} 🔥\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n🏆 ${win} SE LLEVA LA VICTORIA\nDemostraron una coordinación perfecta y se alzaron con el premio.\nEl equipo rival no pudo frenar su avance imparable. 👑 🚲\n\n⚔️ ${lose} LO DIO TODO\nLucharon cada segundo, pero la victoria se les escapó de las manos.\n¡Habrá revancha en el próximo gran evento!\n\n✨ El rugido de los motores se apaga y el ganador es:\n${win}. Los nuevos campeones del evento.`,
(sede, win, lose) => `🔥 GRAN EVENTO EN ${sede} 🔥\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n🏆 ${win} RECLAMA EL TROFEO\nUna exhibición táctica impecable. Se llevaron el objetivo ante la mirada del rival.\nLa gloria y el botín son suyos hoy. 👑 💎\n\n⚔️ ${lose} CAYÓ CON DIGNIDAD\nUna batalla reñida hasta el último aliento. Hoy la suerte no estuvo de su lado.\nEl esfuerzo fue máximo, pero el resultado fue para el otro bando.\n\n✨ ¡La ciudad ha sido testigo de una gran competición!\n${win}. Respeto ganado en la arena.`,
];
function getRandomFlavorText(sede, win, lose, isBicicleta = false) {
const messages = isBicicleta ? eventFinalMessages : finalMessages;
return messages[Math.floor(Math.random() * messages.length)](sede, win, lose);
}
const pendingSetups = new Map();
/**
* Genera un StringSelectMenuBuilder paginado para las facciones (Límite 25 de Discord)
*/
async function getPaginatedFactionMenu(customId, placeholder, page = 0) {
const allFactions = await PostgresFaccionesRepository.getAll();
allFactions.sort((a, b) => a.nombre.localeCompare(b.nombre));
const TOTAL_ITEMS = allFactions.length;
const pageSize = 23;
const totalPages = Math.ceil(TOTAL_ITEMS / pageSize);
const start = page * pageSize;
const end = start + pageSize;
const pagedFactions = allFactions.slice(start, end);
const options = [];
pagedFactions.forEach((data) => {
const emoji = EMOJIS.facciones[data.key] || '🏳️';
options.push({
label: data.nombre,
value: data.key,
emoji: emoji
});
});
if (page < totalPages - 1) {
options.push({
label: `Siguiente Página (${page + 2}/${totalPages}) ➡️`,
value: `PAGINA_SIGUIENTE_${page + 1}`
});
}
if (page > 0) {
options.push({
label: `⬅️ Página Anterior (${page}/${totalPages})`,
value: `PAGINA_ANTERIOR_${page - 1}`
});
}
return new StringSelectMenuBuilder()
.setCustomId(customId)
.setPlaceholder(`${placeholder} (Pág ${page + 1}/${totalPages})`)
.addOptions(options.slice(0, 25).map(opt => {
const builder = new StringSelectMenuOptionBuilder()
.setLabel(opt.label)
.setValue(opt.value);
if (opt.emoji) builder.setEmoji(opt.emoji);
return builder;
}));
}
function shuffleArray(array) {
for (let i = array.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[array[i], array[j]] = [array[j], array[i]];
}
return array;
}
async function assignLeonsToFactions(leonIds, faccionesPorPersona = 1) {
const faccionesBr = await getFaccionesBr();
const faccionesKeys = Object.keys(faccionesBr);
const shuffledFacciones = shuffleArray([...faccionesKeys]);
const assignments = {};
const totalAsignar = leonIds.length * faccionesPorPersona;
const faccionesAsignar = shuffledFacciones.slice(0, totalAsignar);
leonIds.forEach((leonId, index) => {
assignments[leonId] = faccionesAsignar.slice(index * faccionesPorPersona, (index + 1) * faccionesPorPersona);
});
return assignments;
}
function getZonesFromFile(brType) {
const fs = require('fs');
const path = require('path');
const fileName = brType === 'cayo' ? 'Cayo Zonas.txt' : 'Ciudad Zonas.md';
const filePath = path.join(__dirname, '..', '..', fileName);
if (!fs.existsSync(filePath)) return [];
const content = fs.readFileSync(filePath, 'utf8');
return content
.split('\n')
.map(line => line.trim())
.filter(line => line.length > 0)
.map(line => {
const parts = line.split(':');
if (parts.length < 2) return null;
return {
name: parts[0].trim(),
coords: parts.slice(1).join(':').trim()
};
})
.filter(Boolean);
}
async function assignRandomZones(factionKeys, brType) {
const zones = getZonesFromFile(brType);
if (zones.length === 0) return {};
const shuffled = shuffleArray([...zones]);
const zoneAssignments = {};
const totalFactions = factionKeys.length;
const zonesPerFaction = Math.min(1, Math.floor(zones.length / totalFactions));
factionKeys.forEach((fk, index) => {
const start = index * zonesPerFaction;
const end = start + zonesPerFaction;
zoneAssignments[fk] = shuffled.slice(start, end);
});
return zoneAssignments;
}
async function getBrEmbed(session, showCoords = true) {
const tipoBr = session.brType || 'ciudad';
const tipoNombre = tipoBr === 'ciudad' ? 'BR Ciudad' : tipoBr === 'cayo' ? 'BR Cayo' : 'Rey del Crimen';
const emojiTipo = tipoBr === 'ciudad' ? '🏢' : tipoBr === 'cayo' ? '🏝️' : '👑';
let desc = `**${emojiTipo} ${tipoNombre}**\n\n`;
desc += `🦁 **Leones:** ${session.staff.length}\n`;
desc += `📊 **Facciones asignadas:** ${session.brAssignments ? Object.values(session.brAssignments).flat().length : 0}\n\n`;
desc += `**📋 Asignaciones:**\n`;
if (session.brAssignments) {
const faccionesBr = await getFaccionesBr();
for (const [leonId, faccionesAsignadas] of Object.entries(session.brAssignments)) {
desc += `<@${leonId}>:\n`;
const faccionesList = Array.isArray(faccionesAsignadas) ? faccionesAsignadas : [faccionesAsignadas];
for (const fk of faccionesList) {
const faccion = faccionesBr[fk];
const estadoSede = session.brStatus?.[leonId]?.[fk] || 'pendiente';
let estadoEmoji = '⏳';
if (estadoSede === 'voy') estadoEmoji = '✅';
else if (estadoSede === 'novoy') estadoEmoji = '❌';
else if (estadoSede === 'tepeado') estadoEmoji = '🔪';
const coords = showCoords && faccion ? (tipoBr === 'ciudad' ? faccion.coords_br_ciudad : tipoBr === 'cayo' ? faccion.coords_br_cayo : faccion.coords_br_rey) : null;
desc += `   ${estadoEmoji} ${faccion?.emoji || ''} ${faccion?.nombre || fk}${coords ? ` (${coords})` : ''}\n`;
if ((tipoBr === 'ciudad' || tipoBr === 'cayo') && session.brZones && session.brZones[fk] && session.brZones[fk].length > 0) {
const zone = session.brZones[fk][0];
desc += `      🗺️ Zona de ${faccion?.nombre || fk}: \`${zone.coords}\`\n`;
}
}
desc += '\n';
}
}
return new EmbedBuilder()
.setTitle(`${emojiTipo} GESTOR DE ${tipoNombre.toUpperCase()}`)
.setColor(0x00FF00)
.setDescription(desc);
}
function getBrPanelRows(session, sessionId) {
const row1 = new ActionRowBuilder();
row1.addComponents(
new ButtonBuilder().setCustomId(`br1_${sessionId}`).setLabel('✅ Sede IRA').setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId(`br2_${sessionId}`).setLabel('❌ Sede NO IRA').setStyle(ButtonStyle.Danger),
new ButtonBuilder().setCustomId(`br3_${sessionId}`).setLabel('🔪 Tepeada').setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId(`br4_${sessionId}`).setLabel('🔄 Actualizar').setStyle(ButtonStyle.Secondary)
);
const row2 = new ActionRowBuilder();
row2.addComponents(
new ButtonBuilder().setCustomId(`br5_${sessionId}`).setLabel('➕ Agregar León').setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId(`br7_${sessionId}`).setLabel('❌ Borrar León').setStyle(ButtonStyle.Danger),
new ButtonBuilder().setCustomId(`br6_${sessionId}`).setLabel('✅ Finalizar BR').setStyle(ButtonStyle.Danger)
);
return [row1, row2];
}
function createMasterPanelEmbed(session) {
const defName = session.teamA.role === 'Defensa' ? session.teamA.name : session.teamB.name;
const atkName = session.teamA.role === 'Ataque' ? session.teamA.name : session.teamB.name;
let totalMatch = session.capacity.match(/(\d+)\s*vs\s*(\d+)/i);
let totalStr = '';
if (totalMatch) {
totalStr = `\n👥 **Total:** ${parseInt(totalMatch[1]) + parseInt(totalMatch[2])}`;
}
let desc = `**📊 ESTADO ACTUAL**\n`;
desc += `🏰 **Sede:** ${session.sede}\n`;
if (session.isBicicleta) {
desc += `🔵 **Eq. 1:** ${session.teamA.name}\n`;
desc += `🔴 **Eq. 2:** ${session.teamB.name}${totalStr}\n`;
} else {
desc += `🛡️ **Def:** ${defName}\n`;
desc += `⚔️ **Atk:** ${atkName}${totalStr}\n`;
}
desc += `👥 **Capacidad:** ${session.capacity}\n`;
desc += `🦁 **Leones:** ${session.staff.map(id => `<@${id}>`).join(', ')}\n\n`;
desc += `**🌍 UBICACIONES Y COORDENADAS**\n`;
const isBicicleta = session.isBicicleta;
const sedeCoords = session.sedeCoords || { defensa: 'N/A', ataque: 'N/A' };
const atacanteCoords = session.atacanteCoords || 'N/A';
const defensorCoords = session.defensorCoords || 'N/A';
if (isBicicleta) {
desc += `🔵 **Equipo 1 (TP):** \`${sedeCoords.defensa || 'N/A'}\`\n`;
desc += `🔴 **Equipo 2 (TP):** \`${sedeCoords.ataque || 'N/A'}\`\n`;
desc += `🔴 **Coordenadas de ${session.initialAttackers || 'Atacantes'}:** \`${atacanteCoords}\`\n`;
desc += `🔵 **Coordenadas de ${session.initialDefenders || 'Defensores'}:** \`${defensorCoords}\`\n\n`;
} else {
desc += `🛡️ **Defensa (TP):** \`${sedeCoords.defensa || 'N/A'}\`\n`;
desc += `⚔️ **Ataque (TP):** \`${sedeCoords.ataque || 'N/A'}\`\n`;
desc += `⚔️ **Coordenadas de ${session.initialAttackers || 'Atacantes'}:** \`${atacanteCoords}\`\n`;
desc += `🛡️ **Coordenadas de ${session.initialDefenders || 'Defensores'}:** \`${defensorCoords}\`\n\n`;
}
desc += `🎯 **Ronda:** ${session.currentRound || 'N/A'}\n`;
desc += `📈 **Marcador:** ${session.teamA.name || 'N/A'} ${session.teamA.points || 0} - ${session.teamB.points || 0} ${session.teamB.name || 'N/A'}\n\n`;
if (isBicicleta) {
desc += `🎯 **Mejor de 5** | 🏆 **Para ganar:** 3`;
} else {
desc += `🎯 **Mejor de 3** | 🏆 **Para ganar:** 2`;
}
let title = '⚡ GESTOR DE ASALTOS';
if (session.isBicicleta) title = '⚡ GESTOR DE EVENTOS';
else if (session.subtype === 'vip') title = '💎 GESTOR DE ASALTO VIP';
else if (session.subtype === 'custom') title = '🛠️ GESTOR DE ASALTO CUSTOM';
return new EmbedBuilder()
.setTitle(title)
.setColor(session.subtype === 'vip' ? 0xFFD700 : 0xff0000)
.setDescription(desc);
}
function getMasterPanelRows(session, sessionId) {
const isBicicleta = session.isBicicleta;
const targetWins = isBicicleta ? 3 : 2;
const isFinished = session.teamA.points >= targetWins || session.teamB.points >= targetWins;
const isTieBreaker = !isBicicleta && session.teamA.points === 1 && session.teamB.points === 1 && session.currentRound === 3 && !session.tieRolesSelected;
const row1 = new ActionRowBuilder();
if (isBicicleta) {
if (isFinished) {
row1.addComponents(
new ButtonBuilder().setCustomId(`btn_win_a_${sessionId}`).setLabel(`Gana ${session.teamA.name}`).setStyle(ButtonStyle.Primary).setDisabled(true),
new ButtonBuilder().setCustomId(`btn_win_b_${sessionId}`).setLabel(`Gana ${session.teamB.name}`).setStyle(ButtonStyle.Danger).setDisabled(true)
);
} else {
row1.addComponents(
new ButtonBuilder().setCustomId(`btn_win_a_${sessionId}`).setLabel(`Gana ${session.teamA.name}`).setStyle(ButtonStyle.Primary),
new ButtonBuilder().setCustomId(`btn_win_b_${sessionId}`).setLabel(`Gana ${session.teamB.name}`).setStyle(ButtonStyle.Danger)
);
}
} else {
if (isFinished) {
row1.addComponents(
new ButtonBuilder().setCustomId(`btn_win_a_${sessionId}`).setLabel(`Gana ${session.teamA.name}`).setEmoji('🛡️').setStyle(ButtonStyle.Primary).setDisabled(true),
new ButtonBuilder().setCustomId(`btn_win_b_${sessionId}`).setLabel(`Gana ${session.teamB.name}`).setEmoji('⚔️').setStyle(ButtonStyle.Danger).setDisabled(true)
);
} else if (isTieBreaker) {
row1.addComponents(
new ButtonBuilder().setCustomId(`btn_tie_atk_a_${sessionId}`).setLabel(`${session.teamA.name} Ataca (R3)`).setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId(`btn_tie_atk_b_${sessionId}`).setLabel(`${session.teamB.name} Ataca (R3)`).setStyle(ButtonStyle.Danger)
);
} else {
row1.addComponents(
new ButtonBuilder().setCustomId(`btn_win_a_${sessionId}`).setLabel(`Gana ${session.teamA.name}`).setEmoji('🛡️').setStyle(ButtonStyle.Primary),
new ButtonBuilder().setCustomId(`btn_win_b_${sessionId}`).setLabel(`Gana ${session.teamB.name}`).setEmoji('⚔️').setStyle(ButtonStyle.Danger)
);
}
}
const row2 = new ActionRowBuilder();
row2.addComponents(
new ButtonBuilder().setCustomId(`btn_deshacer_${sessionId}`).setLabel('Deshacer Ronda').setEmoji('↩️').setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId(`btn_refrescar_${sessionId}`).setLabel('Refrescar').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId(`btn_add_staff_${sessionId}`).setLabel('Invitar León').setEmoji('➕').setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId(`btn_ver_staff_${sessionId}`).setLabel('Ver Leones').setEmoji('🦁').setStyle(ButtonStyle.Secondary),
isFinished
? new ButtonBuilder().setCustomId(`btn_cancelar_${sessionId}`).setLabel(isBicicleta ? 'Finalizar Evento' : 'Dar por finalizado el asalto').setEmoji('✅').setStyle(ButtonStyle.Success)
: new ButtonBuilder().setCustomId(`btn_cancelar_${sessionId}`).setLabel('Cancelar Evento').setEmoji('❌').setStyle(ButtonStyle.Danger)
);
const row3 = new ActionRowBuilder();
if (session.isBicicleta) {
row3.addComponents(
new ButtonBuilder().setCustomId(`btn_aviso_5m_${sessionId}`).setLabel('5 Minutos').setEmoji('⏱️').setStyle(ButtonStyle.Primary),
new ButtonBuilder().setCustomId(`btn_aviso_objetivo_${sessionId}`).setLabel('Objetivo').setEmoji('🎯').setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId(`btn_aviso_reglas_${sessionId}`).setLabel('Reglas').setEmoji('📜').setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId(`btn_aviso_inicio_${sessionId}`).setLabel('Iniciar Ronda').setEmoji('🎉').setStyle(ButtonStyle.Success)
);
} else {
row3.addComponents(
new ButtonBuilder().setCustomId(`btn_aviso_5m_${sessionId}`).setLabel('5 Minutos').setEmoji('⏱️').setStyle(ButtonStyle.Primary),
new ButtonBuilder().setCustomId(`btn_aviso_reglas_${sessionId}`).setLabel('Reglas').setEmoji('📜').setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId(`btn_aviso_inicio_${sessionId}`).setLabel('Iniciar Ronda').setEmoji('🎉').setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId(`btn_aviso_pausa_${sessionId}`).setLabel('Alerta León (Pausa)').setEmoji('🛑').setStyle(ButtonStyle.Danger)
);
}
return [row1, row2, row3];
}
module.exports = {
name: Events.InteractionCreate,
async execute(interaction) {
try {
if (interaction.isButton() && interaction.customId.startsWith('verif_panel_aprobar_')) {
  const requesterId = interaction.customId.replace('verif_panel_aprobar_', '');
  const VERIF_CHANNEL_ID = '1488594764298195024';
  const embed = new EmbedBuilder()
    .setTitle('🛡️ Sistema de Verificación')
    .setColor(0x5865F2)
    .setDescription(
      '━━━━━━━━━━━━━━━━━━━━━━\n' +
      '**Bienvenido al sistema de verificación del staff.**\n\n' +
      'Para verificarte, haz clic en el botón de abajo y completa el formulario.\n\n' +
      '**📋 Se te pedirá:**\n' +
      '• Nombre IC\n' +
      '• ID\n' +
      '• Rango\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━'
    )
    .setFooter({ text: 'Sistema de Verificación | FiveM Staff' });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_solicitar_verificacion')
      .setLabel('🛡️ Solicitar Verificación')
      .setStyle(ButtonStyle.Primary)
  );
  try {
    const channel = await interaction.client.channels.fetch(VERIF_CHANNEL_ID);
    if (channel) {
      await channel.send({ embeds: [embed], components: [row] });
    }
  } catch (err) {
    console.error('Error enviando panel de verificación:', err);
  }
  const confirmEmbed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Panel Autorizado')
    .setDescription(`El panel de verificación ha sido enviado al canal configurado.\nSolicitado por: <@${requesterId}>`)
    .setTimestamp();
  await interaction.update({ embeds: [confirmEmbed], components: [] });
  try {
    const requester = await interaction.client.users.fetch(requesterId);
    await requester.send('✅ Tu solicitud de panel de verificación ha sido **autorizada** y el panel ya está disponible en el canal configurado.');
  } catch (err) {
    console.error('No se pudo enviar DM al solicitante:', err);
  }
  return;
}
if (interaction.isButton() && interaction.customId.startsWith('verif_panel_rechazar_')) {
  const requesterId = interaction.customId.replace('verif_panel_rechazar_', '');
  const rejectEmbed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('❌ Solicitud Rechazada')
    .setDescription(`La solicitud de panel de verificación ha sido rechazada.\nSolicitado por: <@${requesterId}>`)
    .setTimestamp();
  await interaction.update({ embeds: [rejectEmbed], components: [] });
  try {
    const requester = await interaction.client.users.fetch(requesterId);
    await requester.send('❌ Tu solicitud de panel de verificación ha sido **rechazada** por el administrador.');
  } catch (err) {
    console.error('No se pudo enviar DM al solicitante:', err);
  }
  return;
}
if (interaction.isButton() && interaction.customId === 'btn_solicitar_verificacion') {
const modal = new ModalBuilder()
.setCustomId('solicitar_verificacion_modal')
.setTitle('🛡️ Sistema de Verificación');
const nombreIc = new TextInputBuilder()
.setCustomId('verif_nombre_ic')
.setLabel('Nombre IC')
.setStyle(TextInputStyle.Short)
.setPlaceholder('Ej: Juan_Perez')
.setRequired(true);
const idInput = new TextInputBuilder()
.setCustomId('verif_id')
.setLabel('ID')
.setStyle(TextInputStyle.Short)
.setPlaceholder('Ej: 512')
.setRequired(true);
modal.addComponents(
new ActionRowBuilder().addComponents(nombreIc),
new ActionRowBuilder().addComponents(idInput)
);
return interaction.showModal(modal);
}
if (interaction.isButton() && interaction.customId === 'btn_registrar_asalto') {
const selectTipo = new StringSelectMenuBuilder()
.setCustomId('asalto_seleccionar_tipo')
.setPlaceholder('💎 Selecciona el Tipo de Asalto')
.addOptions(
new StringSelectMenuOptionBuilder()
.setLabel('Asalto de Sede (Normal)')
.setDescription('El proceso clásico con sedes preconfiguradas.')
.setEmoji('🛡️')
.setValue('normal'),
new StringSelectMenuOptionBuilder()
.setLabel('Asalto de Sede (VIP)')
.setDescription('Mismo proceso, pero con recompensa VIP especial.')
.setEmoji('💎')
.setValue('vip'),
new StringSelectMenuOptionBuilder()
.setLabel('Asalto CUSTOM (Manual)')
.setDescription('Configura sede y coordenadas manualmente.')
.setEmoji('🛠️')
.setValue('custom')
);
const row = new ActionRowBuilder().addComponents(selectTipo);
return interaction.reply({
content: '📍 **Paso 1:** Selecciona el tipo de asalto que deseas organizar.',
components: [row],
flags: MessageFlags.Ephemeral
});
}
if (interaction.isButton() && interaction.customId === 'btn_mis_eventos') {
const isAdm = interaction.member.permissions.has(8n) || interaction.user.id === interaction.guild.ownerId;
const allSessions = Array.from(sessionManager.sessions.values());
const filteredSessions = isAdm
? allSessions
: allSessions.filter(s => s.staff && s.staff.includes(interaction.user.id));
if (filteredSessions.length === 0) {
const noMsg = isAdm
? '❌ No hay eventos o asaltos activos en todo el servidor.'
: '❌ No tienes eventos o asaltos activos en este momento.';
return interaction.reply({ content: noMsg, flags: MessageFlags.Ephemeral });
}
const selectMenu = new StringSelectMenuBuilder()
.setCustomId('btn_recuperar_panel_seleccion')
.setPlaceholder(isAdm ? '📂 Todos los Eventos Activos (Vista ADM)' : '📂 Tus Eventos o Asaltos Activos');
filteredSessions.forEach(s => {
const label = `${s.isBicicleta ? '🚲' : '🛡️'} ${s.sede} (${s.teamA.name} vs ${s.teamB.name})`;
selectMenu.addOptions(
new StringSelectMenuOptionBuilder()
.setLabel(label.slice(0, 100))
.setValue(s.id)
);
});
return interaction.reply({
content: isAdm
? '📂 **Panel de Control ADM:** Selecciona cualquier evento activo para recuperarlo.'
: '📂 **Tus Eventos:** Selecciona uno de tus asaltos en curso para recuperar el panel.',
components: [new ActionRowBuilder().addComponents(selectMenu)],
flags: MessageFlags.Ephemeral
});
}
if (interaction.isButton() && interaction.customId === 'btn_ranking_asaltos') {
const { getRanking, getISOYearWeekString, getWeekNumber } = require('../../src/services/assaultPersistence');
const weekNum = getWeekNumber();
const week = getISOYearWeekString();
const ranking = getRanking(week);
if (!ranking.length) {
return interaction.reply({ content: `No hay asalto(s) registrados en la semana **${weekNum}**.`, flags: MessageFlags.Ephemeral });
}
const lines = ranking.slice(0, 20).map((entry, i) => {
const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
return `${medal} **${entry.count}** — <@${entry.userId}>`;
});
const embed = new EmbedBuilder()
.setTitle(`🏆 Ranking Semana ${weekNum}`)
.setColor(0xFFD700)
.setDescription(lines.join('\n'))
.setFooter({ text: `${ranking.length} usuario(s) con assaults` });
return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
if (interaction.isButton() && interaction.customId === 'btn_br_ciudad_iniciar') {
const userSelect = new UserSelectMenuBuilder()
.setCustomId('br_seleccionar_staff_ciudad')
.setPlaceholder('🦁 Selecciona los Leones participantes')
.setMinValues(1)
.setMaxValues(25);
const row = new ActionRowBuilder().addComponents(userSelect);
return interaction.reply({
content: '🏢 **BR CIUDAD** - Selecciona los Leones que participarán:',
components: [row],
flags: MessageFlags.Ephemeral
});
}
if (interaction.isButton() && interaction.customId === 'btn_br_cayo_iniciar') {
const userSelect = new UserSelectMenuBuilder()
.setCustomId('br_seleccionar_staff_cayo')
.setPlaceholder('🦁 Selecciona los Leones participantes')
.setMinValues(1)
.setMaxValues(25);
const row = new ActionRowBuilder().addComponents(userSelect);
return interaction.reply({
content: '🏝️ **BR CAYO** - Selecciona los Leones que participarán:',
components: [row],
flags: MessageFlags.Ephemeral
});
}
if (interaction.isButton() && interaction.customId === 'btn_rey_crimen_iniciar') {
const userSelect = new UserSelectMenuBuilder()
.setCustomId('br_seleccionar_staff_rey')
.setPlaceholder('🦁 Selecciona los Leones participantes')
.setMinValues(1)
.setMaxValues(25);
const row = new ActionRowBuilder().addComponents(userSelect);
return interaction.reply({
content: '👑 **REY DEL CRIMEN** - Selecciona los Leones que participarán:',
components: [row],
flags: MessageFlags.Ephemeral
});
}
if (interaction.isUserSelectMenu() && interaction.customId === 'br_seleccionar_staff_ciudad') {
await interaction.deferReply({ ephemeral: true });
const selectedUsers = Array.from(interaction.users.values()).filter(u => !u.bot);
let leonIds = selectedUsers.map(u => u.id);
if (!leonIds.includes(interaction.user.id)) {
leonIds.unshift(interaction.user.id);
}
const faccionesBr = await getFaccionesBr();
const faccionesPorPersona = Math.floor(Object.keys(faccionesBr).length / leonIds.length);
const assignments = await assignLeonsToFactions(leonIds, faccionesPorPersona);
const allFactionKeys = Object.values(assignments).flat();
const zoneAssignments = await assignRandomZones(allFactionKeys, 'ciudad');
const sessionId = Math.random().toString(36).substring(2, 10).padEnd(8, '0');
const session = {
id: sessionId,
staff: leonIds,
brType: 'ciudad',
brAssignments: assignments,
brZones: zoneAssignments,
brStatus: {},
isBicicleta: false,
sede: 'BR Ciudad',
creatorId: interaction.user.id
};
sessionManager.createSession(sessionId, {
sede: 'BR Ciudad',
defenders: 'BR',
attackers: 'BR',
capacity: leonIds.length + ' vs ' + leonIds.length,
staff: leonIds,
isBicicleta: false,
subtype: 'br_ciudad',
creatorId: interaction.user.id
});
session.subtype = 'br_ciudad';
session.history = [];
sessionManager.updateSession(sessionId, session);
const creatorName = interaction.user.globalName || interaction.user.username;
const staffList = leonIds.map(id => `<@${id}>`).join(', ');
const embedPublic = new EmbedBuilder()
.setColor(0xFFA500)
.setAuthor({
name: 'NUEVO BR CIUDAD REGISTRADO',
iconURL: 'https://cdn.discordapp.com/emojis/1053421111624646736.webp'
})
.setTitle(`🏢 BR CIUDAD: BR Ciudad`)
.setDescription(
`🦁 **Leones Cargados:** ${staffList}\n\n` +
`⚡ **REGLAS RÁPIDAS — BR CIUDAD** ⚡\n` +
`1️⃣ Solo los leones pueden acceder al panel.\n` +
`2️⃣ Confirma las sedes asignadas con los botones.\n` +
`3️⃣ Cada león tiene ${faccionesPorPersona} sedes a su cargo.\n` +
`4️⃣ Usa los botones para confirmar asistencia o tepear.`
)
.setFooter({ text: `Panel ID: #${sessionId.slice(-5)} • Registrado por ${creatorName}`, iconURL: interaction.user.displayAvatarURL() });
const btnVerPanel = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId(`br_ver_panel_${sessionId}`)
.setLabel(`👁️ Ver Panel de ${creatorName}`)
.setStyle(ButtonStyle.Secondary)
);
await interaction.editReply({ content: '✅ Organizadores confirmados. Generando panel...', components: [], embeds: [] });
const msg = await interaction.channel.send({ embeds: [embedPublic], components: [btnVerPanel] });
session.announcementMsgId = msg.id;
session.announcementChannelId = msg.channelId;
sessionManager.updateSession(sessionId, session);
return;
}
if (interaction.isUserSelectMenu() && interaction.customId === 'br_seleccionar_staff_cayo') {
await interaction.deferReply({ ephemeral: true });
const selectedUsers = Array.from(interaction.users.values()).filter(u => !u.bot);
let leonIds = selectedUsers.map(u => u.id);
if (!leonIds.includes(interaction.user.id)) {
leonIds.unshift(interaction.user.id);
}
const faccionesBr = await getFaccionesBr();
const faccionesPorPersona = Math.floor(Object.keys(faccionesBr).length / leonIds.length);
const assignments = await assignLeonsToFactions(leonIds, faccionesPorPersona);
const allFactionKeys = Object.values(assignments).flat();
const zoneAssignments = await assignRandomZones(allFactionKeys, 'cayo');
const sessionId = Math.random().toString(36).substring(2, 10).padEnd(8, '0');
const session = {
id: sessionId,
staff: leonIds,
brType: 'cayo',
brAssignments: assignments,
brZones: zoneAssignments,
brStatus: {},
isBicicleta: false,
sede: 'BR Cayo',
creatorId: interaction.user.id
};
sessionManager.createSession(sessionId, {
sede: 'BR Cayo',
defenders: 'BR',
attackers: 'BR',
capacity: leonIds.length + ' vs ' + leonIds.length,
staff: leonIds,
isBicicleta: false,
subtype: 'br_cayo',
creatorId: interaction.user.id
});
session.subtype = 'br_cayo';
session.history = [];
sessionManager.updateSession(sessionId, session);
const creatorName = interaction.user.globalName || interaction.user.username;
const staffList = leonIds.map(id => `<@${id}>`).join(', ');
const embedPublic = new EmbedBuilder()
.setColor(0xFFA500)
.setAuthor({
name: 'NUEVO BR CAYO REGISTRADO',
iconURL: 'https://cdn.discordapp.com/emojis/1053421111624646736.webp'
})
.setTitle(`🏝️ BR CAYO PERLAS: BR Cayo`)
.setDescription(
`🦁 **Leones Cargados:** ${staffList}\n\n` +
`⚡ **REGLAS RÁPIDAS — BR CAYO** ⚡\n` +
`1️⃣ Solo los leones pueden acceder al panel.\n` +
`2️⃣ Confirma las sedes asignadas con los botones.\n` +
`3️⃣ Cada león tiene ${faccionesPorPersona} sedes a su cargo.\n` +
`4️⃣ Usa los botones para confirmar asistencia o tepear.`
)
.setFooter({ text: `Panel ID: #${sessionId.slice(-5)} • Registrado por ${creatorName}`, iconURL: interaction.user.displayAvatarURL() });
const btnVerPanel = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId(`br_ver_panel_${sessionId}`)
.setLabel(`👁️ Ver Panel de ${creatorName}`)
.setStyle(ButtonStyle.Secondary)
);
await interaction.editReply({ content: '✅ Organizadores confirmados. Generando panel...', components: [], embeds: [] });
const msg = await interaction.channel.send({ embeds: [embedPublic], components: [btnVerPanel] });
session.announcementMsgId = msg.id;
session.announcementChannelId = msg.channelId;
sessionManager.updateSession(sessionId, session);
return;
}
if (interaction.isUserSelectMenu() && interaction.customId === 'br_seleccionar_staff_rey') {
await interaction.deferReply({ ephemeral: true });
const selectedUsers = Array.from(interaction.users.values()).filter(u => !u.bot);
let leonIds = selectedUsers.map(u => u.id);
if (!leonIds.includes(interaction.user.id)) {
leonIds.unshift(interaction.user.id);
}
const faccionesBr = await getFaccionesBr();
const faccionesPorPersona = Math.floor(Object.keys(faccionesBr).length / leonIds.length);
const assignments = await assignLeonsToFactions(leonIds, faccionesPorPersona);
const sessionId = Math.random().toString(36).substring(2, 10).padEnd(8, '0');
const session = {
id: sessionId,
staff: leonIds,
brType: 'rey',
brAssignments: assignments,
brStatus: {},
isBicicleta: false,
sede: 'Rey del Crimen',
creatorId: interaction.user.id
};
sessionManager.createSession(sessionId, {
sede: 'Rey del Crimen',
defenders: 'BR',
attackers: 'BR',
capacity: leonIds.length + ' vs ' + leonIds.length,
staff: leonIds,
isBicicleta: false,
subtype: 'br_rey',
creatorId: interaction.user.id
});
session.subtype = 'br_rey';
session.history = [];
sessionManager.updateSession(sessionId, session);
const creatorName = interaction.user.globalName || interaction.user.username;
const staffList = leonIds.map(id => `<@${id}>`).join(', ');
const embedPublic = new EmbedBuilder()
.setColor(0xFFA500)
.setAuthor({
name: 'NUEVO REY DEL CRIMEN REGISTRADO',
iconURL: 'https://cdn.discordapp.com/emojis/1053421111624646736.webp'
})
.setTitle(`👑 REY DEL CRIMEN: Rey del Crimen`)
.setDescription(
`🦁 **Leones Cargados:** ${staffList}\n\n` +
`⚡ **REGLAS RÁPIDAS — REY DEL CRIMEN** ⚡\n` +
`1️⃣ Solo los leones pueden acceder al panel.\n` +
`2️⃣ Confirma las sedes asignadas con los botones.\n` +
`3️⃣ Cada león tiene ${faccionesPorPersona} sedes a su cargo.\n` +
`4️⃣ Usa los botones para confirmar asistencia o tepear.`
)
.setFooter({ text: `Panel ID: #${sessionId.slice(-5)} • Registrado por ${creatorName}`, iconURL: interaction.user.displayAvatarURL() });
const btnVerPanel = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId(`br_ver_panel_${sessionId}`)
.setLabel(`👁️ Ver Panel de ${creatorName}`)
.setStyle(ButtonStyle.Secondary)
);
await interaction.editReply({ content: '✅ Organizadores confirmados. Generando panel...', components: [], embeds: [] });
const msg = await interaction.channel.send({ embeds: [embedPublic], components: [btnVerPanel] });
session.announcementMsgId = msg.id;
session.announcementChannelId = msg.channelId;
sessionManager.updateSession(sessionId, session);
return;
}
if (interaction.isButton() && interaction.customId.startsWith('br1_')) {
const sessionId = interaction.customId.replace('br1_', '');
let session = sessionManager.getSession(sessionId);
if (!session) return interaction.reply({ content: '❌ Sesión no encontrada.', flags: MessageFlags.Ephemeral });
const misFacciones = session.brAssignments?.[interaction.user.id] || [];
if (!Array.isArray(misFacciones) || misFacciones.length === 0) {
return interaction.reply({ content: '❌ No tienes facciones asignadas.', flags: MessageFlags.Ephemeral });
}
const faccionesBr = await getFaccionesBr();
const opciones = misFacciones.map(fk => {
const fac = faccionesBr[fk];
return { label: `${fac?.emoji || ''} ${fac?.nombre || fk}`, value: `${sessionId}_${fk}` };
});
const select = new StringSelectMenuBuilder()
.setCustomId('br_confirmar_voy')
.setPlaceholder('Selecciona la sede que confirmarás')
.setMinValues(1)
.setMaxValues(1);
opciones.slice(0, 25).forEach(opt => select.addOptions(new StringSelectMenuOptionBuilder().setLabel(opt.label).setValue(opt.value)));
const row = new ActionRowBuilder().addComponents(select);
return interaction.reply({ content: '✅ Selecciona la sede que IRÁ al BR:', components: [row], flags: MessageFlags.Ephemeral });
}
if (interaction.isStringSelectMenu() && interaction.customId === 'br_confirmar_voy') {
const value = interaction.values[0];
const firstUnderscore = value.indexOf('_');
const sessionId = value.substring(0, firstUnderscore);
const faccionKey = value.substring(firstUnderscore + 1);
let session = sessionManager.getSession(sessionId);
if (!session) return interaction.update({ content: '❌ Sesión no encontrada.', components: [] });
session.brStatus = session.brStatus || {};
session.brStatus[interaction.user.id] = session.brStatus[interaction.user.id] || {};
session.brStatus[interaction.user.id][faccionKey] = 'voy';
sessionManager.updateSession(sessionId, session);
const faccionesBr = await getFaccionesBr();
const fac = faccionesBr[faccionKey];
await interaction.update({ content: `✅ Confirmado: **${fac?.nombre || faccionKey}** SÍ irá al BR`, components: [] });
const embed = await getBrEmbed(session, true);
const rows = getBrPanelRows(session, sessionId);
return interaction.followUp({ embeds: [embed], components: rows, flags: MessageFlags.Ephemeral });
}
if (interaction.isButton() && interaction.customId.startsWith('br2_')) {
const sessionId = interaction.customId.replace('br2_', '');
let session = sessionManager.getSession(sessionId);
if (!session) return interaction.reply({ content: '❌ Sesión no encontrada.', flags: MessageFlags.Ephemeral });
const misFacciones = session.brAssignments?.[interaction.user.id] || [];
if (!Array.isArray(misFacciones) || misFacciones.length === 0) {
return interaction.reply({ content: '❌ No tienes facciones asignadas.', flags: MessageFlags.Ephemeral });
}
const faccionesBr = await getFaccionesBr();
const opciones = misFacciones.map(fk => {
const fac = faccionesBr[fk];
return { label: `${fac?.emoji || ''} ${fac?.nombre || fk}`, value: `${sessionId}_${fk}` };
});
const select = new StringSelectMenuBuilder()
.setCustomId('br_confirmar_novoy')
.setPlaceholder('Selecciona la sede que NO irá al BR')
.setMinValues(1)
.setMaxValues(1);
opciones.slice(0, 25).forEach(opt => select.addOptions(new StringSelectMenuOptionBuilder().setLabel(opt.label).setValue(opt.value)));
const row = new ActionRowBuilder().addComponents(select);
return interaction.reply({ content: '❌ Selecciona la sede que NO irá al BR:', components: [row], flags: MessageFlags.Ephemeral });
}
if (interaction.isStringSelectMenu() && interaction.customId === 'br_confirmar_novoy') {
const value = interaction.values[0];
const firstUnderscore = value.indexOf('_');
const sessionId = value.substring(0, firstUnderscore);
const faccionKey = value.substring(firstUnderscore + 1);
let session = sessionManager.getSession(sessionId);
if (!session) return interaction.update({ content: '❌ Sesión no encontrada.', components: [] });
session.brStatus = session.brStatus || {};
session.brStatus[interaction.user.id] = session.brStatus[interaction.user.id] || {};
session.brStatus[interaction.user.id][faccionKey] = 'novoy';
sessionManager.updateSession(sessionId, session);
const faccionesBr = await getFaccionesBr();
const fac = faccionesBr[faccionKey];
await interaction.update({ content: `❌ Confirmado: **${fac?.nombre || faccionKey}** NO irá al BR`, components: [] });
const embed = await getBrEmbed(session, true);
const rows = getBrPanelRows(session, sessionId);
return interaction.followUp({ embeds: [embed], components: rows, flags: MessageFlags.Ephemeral });
}
if (interaction.isButton() && interaction.customId.startsWith('br3_')) {
const sessionId = interaction.customId.replace('br3_', '');
let session = sessionManager.getSession(sessionId);
if (!session) return interaction.reply({ content: '❌ Sesión no encontrada.', flags: MessageFlags.Ephemeral });
const misFacciones = session.brAssignments?.[interaction.user.id] || [];
if (!Array.isArray(misFacciones) || misFacciones.length === 0) {
return interaction.reply({ content: '❌ No tienes facciones asignadas.', flags: MessageFlags.Ephemeral });
}
const faccionesBr = await getFaccionesBr();
const opciones = misFacciones.map(fk => {
const fac = faccionesBr[fk];
return { label: `${fac?.emoji || ''} ${fac?.nombre || fk}`, value: `${sessionId}_${fk}` };
});
const select = new StringSelectMenuBuilder()
.setCustomId('br_confirmar_tepeado')
.setPlaceholder('Selecciona la sede donde te tepearon')
.setMinValues(1)
.setMaxValues(1);
opciones.slice(0, 25).forEach(opt => select.addOptions(new StringSelectMenuOptionBuilder().setLabel(opt.label).setValue(opt.value)));
const row = new ActionRowBuilder().addComponents(select);
return interaction.reply({ content: '🔪 Selecciona la sede que fue TEPEADA (enviada al mundo royale):', components: [row], flags: MessageFlags.Ephemeral });
}
if (interaction.isStringSelectMenu() && interaction.customId === 'br_confirmar_tepeado') {
const value = interaction.values[0];
const firstUnderscore = value.indexOf('_');
const sessionId = value.substring(0, firstUnderscore);
const faccionKey = value.substring(firstUnderscore + 1);
let session = sessionManager.getSession(sessionId);
if (!session) return interaction.update({ content: '❌ Sesión no encontrada.', components: [] });
session.brStatus = session.brStatus || {};
session.brStatus[interaction.user.id] = session.brStatus[interaction.user.id] || {};
session.brStatus[interaction.user.id][faccionKey] = 'tepeado';
sessionManager.updateSession(sessionId, session);
const faccionesBr = await getFaccionesBr();
const fac = faccionesBr[faccionKey];
await interaction.update({ content: `🔪 **${fac?.nombre || faccionKey}** ha sido TEPEADA (enviada al mundo royale)`, components: [] });
const embed = await getBrEmbed(session, true);
const rows = getBrPanelRows(session, sessionId);
return interaction.followUp({ embeds: [embed], components: rows, flags: MessageFlags.Ephemeral });
}
if (interaction.isButton() && interaction.customId.startsWith('br4_')) {
const sessionId = interaction.customId.replace('br4_', '');
const session = sessionManager.getSession(sessionId);
if (!session) return interaction.reply({ content: '❌ Sesión no encontrada.', flags: MessageFlags.Ephemeral });
const embed = await getBrEmbed(session, true);
const rows = getBrPanelRows(session, sessionId);
return interaction.update({ embeds: [embed], components: rows });
}
if (interaction.isButton() && interaction.customId.startsWith('br5_')) {
const sessionId = interaction.customId.replace('br5_', '');
const userSelect = new UserSelectMenuBuilder()
.setCustomId(`br_add_staff_${sessionId}`)
.setPlaceholder('Selecciona un León')
.setMinValues(1)
.setMaxValues(10);
const row = new ActionRowBuilder().addComponents(userSelect);
return interaction.reply({
content: '🦁 Selecciona el León a agregar:',
components: [row],
flags: MessageFlags.Ephemeral
});
}
if (interaction.isUserSelectMenu() && interaction.customId.startsWith('br_add_staff_')) {
const sessionId = interaction.customId.replace('br_add_staff_', '');
let session = sessionManager.getSession(sessionId);
if (!session) return interaction.update({ content: '❌ Sesión no encontrada.', components: [] });
const newUsers = Array.from(interaction.users.values()).filter(u => !u.bot);
const newLeons = newUsers.map(u => u.id).filter(id => !session.staff.includes(id));
if (newLeons.length > 0) {
const faccionesBr = await getFaccionesBr();
const allFactionKeys = Object.keys(faccionesBr);
const shuffled = shuffleArray([...allFactionKeys]);
const newStaff = [...session.staff, ...newLeons];
const perLeon = Math.floor(shuffled.length / newStaff.length);
const remainder = shuffled.length % newStaff.length;
session.brAssignments = {};
newStaff.forEach((leonId, index) => {
const start = index * perLeon + Math.min(index, remainder);
const end = start + perLeon + (index < remainder ? 1 : 0);
session.brAssignments[leonId] = shuffled.slice(start, end);
});
session.staff = newStaff;
const brType = session.brType || 'ciudad';
if ((brType === 'ciudad' || brType === 'cayo') && session.brAssignments) {
const allAssignedFactions = Object.values(session.brAssignments).flat();
session.brZones = await assignRandomZones(allAssignedFactions, brType);
}
sessionManager.updateSession(sessionId, session);
}
const embed = await getBrEmbed(session, true);
const rows = getBrPanelRows(session, sessionId);
return interaction.update({ embeds: [embed], components: rows });
}
if (interaction.isButton() && interaction.customId.startsWith('br7_')) {
const sessionId = interaction.customId.replace('br7_', '');
const session = sessionManager.getSession(sessionId);
if (!session) return interaction.reply({ content: '❌ Sesión no encontrada.', flags: MessageFlags.Ephemeral });
if (interaction.user.id !== session.creatorId) {
  return interaction.reply({ content: '❌ Solo el creador del panel puede borrar leones.', flags: MessageFlags.Ephemeral });
}
const userSelect = new UserSelectMenuBuilder()
.setCustomId(`br_remove_staff_${sessionId}`)
.setPlaceholder('Selecciona el León a eliminar')
.setMinValues(1)
.setMaxValues(1);
const row = new ActionRowBuilder().addComponents(userSelect);
return interaction.reply({
  content: '❌ Selecciona el León a eliminar:',
  components: [row],
  flags: MessageFlags.Ephemeral
});
}
if (interaction.isUserSelectMenu() && interaction.customId.startsWith('br_remove_staff_')) {
const sessionId = interaction.customId.replace('br_remove_staff_', '');
let session = sessionManager.getSession(sessionId);
if (!session) return interaction.update({ content: '❌ Sesión no encontrada.', components: [] });
const selectedUsers = Array.from(interaction.users.values());
const removedIds = selectedUsers.map(u => u.id);
session.staff = session.staff.filter(id => !removedIds.includes(id));
if (session.staff.length > 0) {
const faccionesBr = await getFaccionesBr();
const allFactionKeys = Object.keys(faccionesBr);
const shuffled = shuffleArray([...allFactionKeys]);
const perLeon = Math.floor(shuffled.length / session.staff.length);
const remainder = shuffled.length % session.staff.length;
session.brAssignments = {};
session.staff.forEach((leonId, index) => {
const start = index * perLeon + Math.min(index, remainder);
const end = start + perLeon + (index < remainder ? 1 : 0);
session.brAssignments[leonId] = shuffled.slice(start, end);
});
const brType = session.brType || 'ciudad';
if ((brType === 'ciudad' || brType === 'cayo') && session.brAssignments) {
const allAssignedFactions = Object.values(session.brAssignments).flat();
session.brZones = await assignRandomZones(allAssignedFactions, brType);
}
} else {
session.brAssignments = {};
session.brZones = {};
}
sessionManager.updateSession(sessionId, session);
const embed = getBrEmbed(session, true);
const rows = getBrPanelRows(session, sessionId);
return interaction.update({ embeds: [embed], components: rows });
}
if (interaction.isButton() && interaction.customId.startsWith('br_ver_panel_')) {
const sessionId = interaction.customId.replace('br_ver_panel_', '');
const session = sessionManager.getSession(sessionId);
if (!session) return interaction.reply({ content: 'El evento ya finalizó o fue cancelado.', flags: MessageFlags.Ephemeral });
const isStaff = session.staff?.includes(interaction.user.id);
if (!isStaff) {
return interaction.reply({ content: '❌ No cuentas con permisos. Solo los leones asignados pueden ver el panel.', flags: MessageFlags.Ephemeral });
}
const embed = getBrEmbed(session, true);
const rows = getBrPanelRows(session, sessionId);
return interaction.reply({ embeds: [embed], components: rows, flags: MessageFlags.Ephemeral });
}
if (interaction.isButton() && interaction.customId.startsWith('br6_')) {
const sessionId = interaction.customId.replace('br6_', '');
const session = sessionManager.getSession(sessionId);
if (!session) return interaction.reply({ content: '❌ Sesión no encontrada.', flags: MessageFlags.Ephemeral });

const isReyDelCrimen = session.brType === 'rey' || session.sede?.toLowerCase().includes('rey');
if (isReyDelCrimen) {
  const modal = new ModalBuilder()
    .setCustomId(`rey_ganador_modal_${sessionId}`)
    .setTitle('👑 Rey del Crimen - Ganador');
  const winnerInput = new TextInputBuilder()
    .setCustomId('rey_ganador_input')
    .setLabel('Nombre del ganador')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ej: Facción Ganadora')
    .setRequired(true);
  const row = new ActionRowBuilder().addComponents(winnerInput);
  modal.addComponents(row);
  return interaction.showModal(modal);
}

await interaction.deferReply({ ephemeral: true });

const saveResult = await assaultPersistence.saveBrEvent(session, sessionId);

if (session.announcementMsgId && session.announcementChannelId) {
  try {
    const channel = await interaction.client.channels.fetch(session.announcementChannelId);
    if (channel) {
      const msg = await channel.messages.fetch(session.announcementMsgId);
      if (msg) await msg.delete();
    }
  } catch (err) {
    console.error('Error borrando mensaje de BR:', err);
  }
}

const sedeName = session.sede || 'BR';
const brTypeLabel = session.brType === 'rey' ? 'REY DEL CRIMEN' : session.brType === 'cayo' ? 'BR CAYO PERLAS' : 'BR CIUDAD';
const creator = session.creatorId ? `<@${session.creatorId}>` : 'Desconocido';
const staffList = session.staff ? session.staff.map(id => `<@${id}>`).join(', ') : 'Sin staff';

sessionManager.deleteSession(sessionId);

let saveNote = '';
if (saveResult && saveResult.ok) {
  saveNote = `\n📅 **Registrado:** Semana ${saveResult.isoYearWeek}`;
}

return interaction.editReply({ 
  content: `✅ **BR FINALIZADO**\n` +
  `📌 ${brTypeLabel}: ${sedeName}\n` +
  `🦁 Leones: ${staffList}\n\n` +
  `Panel ID: #${sessionId} • Registrado por ${creator}` +
  saveNote
});
}
if (interaction.isButton() && interaction.customId === 'btn_ranking_semana') {
const { getRanking, getISOYearWeekString, getWeekNumber } = require('../../src/services/assaultPersistence');
const weekNum = getWeekNumber();
const week = getISOYearWeekString();
const ranking = getRanking(week);
if (!ranking.length) {
return interaction.reply({ content: `No hay asalto(s) registrados en la semana **${weekNum}**.`, flags: MessageFlags.Ephemeral });
}
const lines = ranking.slice(0, 20).map((entry, i) => {
const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
return `${medal} **${entry.count}** — <@${entry.userId}>`;
});
const embed = new EmbedBuilder()
.setTitle(`🏆 Ranking Semana ${weekNum}`)
.setColor(0xFFD700)
.setDescription(lines.join('\n'))
.setFooter({ text: `${ranking.length} usuario(s) con assaults` });
return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
if (interaction.isButton() && interaction.customId === 'btn_ranking_mes') {
const { getRankingMensual, getMonthString } = require('../../src/services/assaultPersistence');
const monthStr = getMonthString();
const ranking = getRankingMensual();
if (!ranking.length) {
return interaction.reply({ content: `No hay asalto(s) registrados en **${monthStr}**.`, flags: MessageFlags.Ephemeral });
}
const lines = ranking.slice(0, 20).map((entry, i) => {
const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
return `${medal} **${entry.count}** — <@${entry.userId}>`;
});
const embed = new EmbedBuilder()
.setTitle(`🏆 Ranking ${monthStr}`)
.setColor(0xFFD700)
.setDescription(lines.join('\n'))
.setFooter({ text: `${ranking.length} usuario(s) con assaults` });
return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
if (interaction.isButton() && interaction.customId === 'btn_buscar_semana') {
const { getRanking } = require('../../src/services/assaultPersistence');
const currentYear = new Date().getFullYear();
const options = [];
const currentWeek = Math.min(52, new Date().getWeek ? new Date().getWeek() : 14);
const startWeek = Math.max(1, currentWeek - 24);
for (let i = startWeek; i <= currentWeek; i++) {
const weekStr = `${currentYear}-W${String(i).padStart(2, '0')}`;
options.push({ label: `Semana ${i}`, value: weekStr });
}
const selectMenu = new StringSelectMenuBuilder()
.setCustomId('select_semana_ranking')
.setPlaceholder('Selecciona una semana')
.setMinValues(1)
.setMaxValues(1);
options.slice(0, 25).forEach(opt => selectMenu.addOptions(opt));
const row = new ActionRowBuilder().addComponents(selectMenu);
return interaction.reply({ content: '🔍 **Selecciona la semana que quieres ver:**', components: [row], flags: MessageFlags.Ephemeral });
}
if (interaction.isStringSelectMenu() && interaction.customId === 'select_semana_ranking') {
const selectedWeek = interaction.values[0];
const { getRanking } = require('../../src/services/assaultPersistence');
const ranking = getRanking(selectedWeek);
const weekNum = selectedWeek.split('-W')[1];
if (!ranking.length) {
return interaction.update({ content: `No hay asalto(s) registrados en la **Semana ${weekNum}**.`, components: [] });
}
const lines = ranking.slice(0, 20).map((entry, i) => {
const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
return `${medal} **${entry.count}** — <@${entry.userId}>`;
});
const embed = new EmbedBuilder()
.setTitle(`🏆 Ranking Semana ${weekNum}`)
.setColor(0xFFD700)
.setDescription(lines.join('\n'))
.setFooter({ text: `${ranking.length} usuario(s) con assaults` });
return interaction.update({ embeds: [embed], components: [] });
}
if (interaction.isStringSelectMenu() && interaction.customId === 'btn_recuperar_panel_seleccion') {
const sessionId = interaction.values[0];
const session = sessionManager.getSession(sessionId);
if (!session) return interaction.update({ content: '❌ La sesión ya no existe.', components: [] });
const embed = createMasterPanelEmbed(session);
return interaction.update({
content: `♻️ **Panel Recuperado:** Aquí tienes el control de tu evento en **${session.sede}**.`,
embeds: [embed],
components: getMasterPanelRows(session, sessionId)
});
}
if (interaction.isButton() && interaction.customId === 'btn_asalto_custom_defensor') {
const modal = new ModalBuilder()
.setCustomId('asalto_custom_defensor_modal')
.setTitle('🛡️ Nombre Custom: Equipo 1 / Defensor');
const nameInput = new TextInputBuilder()
.setCustomId('custom_name')
.setLabel('Nombre de la Facción')
.setStyle(TextInputStyle.Short)
.setPlaceholder('Ej: Los Blancos')
.setRequired(true);
modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
return await interaction.showModal(modal);
}
if (interaction.isButton() && interaction.customId === 'btn_asalto_custom_atacante') {
const modal = new ModalBuilder()
.setCustomId('asalto_custom_atacante_modal')
.setTitle('⚔️ Nombre Custom: Equipo 2 / Atacante');
const nameInput = new TextInputBuilder()
.setCustomId('custom_name')
.setLabel('Nombre de la Facción')
.setStyle(TextInputStyle.Short)
.setPlaceholder('Ej: Los Negros')
.setRequired(true);
modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
return await interaction.showModal(modal);
}
if (interaction.isButton() && interaction.customId === 'btn_abrir_setup_modal') {
const setup = pendingSetups.get(interaction.user.id);
if (!setup) return interaction.reply({ content: 'Sesión expirada.', flags: MessageFlags.Ephemeral });
const modal = new ModalBuilder()
.setCustomId('asalto_setup_modal')
.setTitle(`👥 Configuración de ${setup.isBicicleta ? 'Evento' : 'Asalto'}`);
const capacidadInput = new TextInputBuilder()
.setCustomId('capacidad')
.setLabel('Cantidad (ej. 15, 20)')
.setStyle(TextInputStyle.Short)
.setPlaceholder('NUMERO')
.setRequired(true);
modal.addComponents(new ActionRowBuilder().addComponents(capacidadInput));
return interaction.showModal(modal);
}
if (interaction.isStringSelectMenu() && interaction.customId === 'asalto_seleccionar_tipo') {
const subtype = interaction.values[0];
pendingSetups.set(interaction.user.id, { subtype });
if (subtype === 'custom') {
const modal = new ModalBuilder()
.setCustomId('asalto_custom_setup_modal')
.setTitle('🛠️ Configuración Asalto Custom');
const nameInput = new TextInputBuilder()
.setCustomId('nombre_sede')
.setLabel('Nombre de la Sede/Lugar')
.setStyle(TextInputStyle.Short)
.setPlaceholder('Ej: Banco Central / Aeropuerto')
.setRequired(true);
const defCoords = new TextInputBuilder()
.setCustomId('def_coords')
.setLabel('Coordenadas Defensa (TP)')
.setStyle(TextInputStyle.Short)
.setPlaceholder('Ej: 123.4, -567.8, 90.1')
.setRequired(true);
const atkCoords = new TextInputBuilder()
.setCustomId('atk_coords')
.setLabel('Coordenadas Ataque (TP)')
.setStyle(TextInputStyle.Short)
.setPlaceholder('Ej: 234.5, -678.9, 01.2')
.setRequired(true);
modal.addComponents(
new ActionRowBuilder().addComponents(nameInput),
new ActionRowBuilder().addComponents(defCoords),
new ActionRowBuilder().addComponents(atkCoords)
);
return interaction.showModal(modal);
}
const sedesDb = await PostgresSedesRepository.getAll();
const sedeOptions = sedesDb.length > 0
? sedesDb.map(s => {
    const emojiKey = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const emoji = EMOJIS.sedes[emojiKey] || '🏰';
    return new StringSelectMenuOptionBuilder()
      .setLabel(s.name)
      .setDescription(`Cap: ${s.capacidad}`)
      .setEmoji(emoji)
      .setValue(s.name);
  })
: [new StringSelectMenuOptionBuilder()
    .setLabel('No hay sedes — usa Agregar Sede primero')
    .setValue('none')];
const selectSede = new StringSelectMenuBuilder()
.setCustomId('asalto_seleccionar_sede')
.setPlaceholder('🏰 Selecciona la Sede')
.addOptions(sedeOptions.slice(0, 25));
const row = new ActionRowBuilder().addComponents(selectSede);
const subtypeLabel = subtype ? subtype.toUpperCase() : 'NORMAL';
return interaction.update({
content: `📍 **Paso 2:** Selecciona la Sede para el asalto **${subtypeLabel}**.`,
components: [row]
});
}
if (interaction.isModalSubmit() && interaction.customId === 'asalto_custom_setup_modal') {
const setup = pendingSetups.get(interaction.user.id);
if (!setup) return interaction.reply({ content: 'Sesión expirada.', flags: MessageFlags.Ephemeral });
setup.sedeData = {
nombre: interaction.fields.getTextInputValue('nombre_sede'),
coords: {
defensa: interaction.fields.getTextInputValue('def_coords'),
ataque: interaction.fields.getTextInputValue('atk_coords')
}
};
setup.isBicicleta = false;
const selectDefensor = await getPaginatedFactionMenu('asalto_seleccionar_defensor', '🛡️ Selección: Defensor');
const row1 = new ActionRowBuilder().addComponents(selectDefensor);
const row2 = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId('btn_asalto_custom_defensor').setLabel('✍️ Nombre Personalizado').setStyle(ButtonStyle.Secondary)
);
const responseData = {
content: '🛡️ **Paso 2:** Selecciona la facción **DEFENSORA**.',
components: [row1, row2],
flags: MessageFlags.Ephemeral
};
try {
if (interaction.isFromMessage()) {
return await interaction.update(responseData);
} else {
return await interaction.reply(responseData);
}
} catch (error) {
if (interaction.replied || interaction.deferred) {
return interaction.followUp(responseData);
} else {
return interaction.reply(responseData);
}
}
}
if (interaction.isButton() && interaction.customId === 'btn_registrar_duelo') {
const selectEvento = new StringSelectMenuBuilder()
.setCustomId('evento_seleccionar_tipo')
.setPlaceholder('🎮 Selecciona el Evento (Pag 1/1)')
.addOptions(
new StringSelectMenuOptionBuilder()
.setLabel('Roba la Bicicleta al León')
.setDescription('Muerte de equipo (BO5) por la bicicleta central.')
.setEmoji('🚲')
.setValue('bicicleta')
);
const row = new ActionRowBuilder().addComponents(selectEvento);
return interaction.reply({
content: '📍 **Paso 1 (Eventos):** Selecciona el modo de juego que deseas organizar.',
components: [row],
flags: MessageFlags.Ephemeral
});
}
if (interaction.isStringSelectMenu() && interaction.customId === 'evento_seleccionar_tipo') {
const eventoId = interaction.values[0];
pendingSetups.set(interaction.user.id, {
isBicicleta: eventoId === 'bicicleta',
sedeId: 'BICICLETA_MAPA',
sedeData: {
nombre: 'Zona Central de Bicicletas',
capacidad: '10 vs 10 / 15 vs 15',
coords: {
defensa: "352.05, -1961.27, 24.50, 304.62", // Equipo 1
ataque: "308.73, -2107.26, 17.65, 150.51"   // Equipo 2
}
}
});
const selectDefensor = await getPaginatedFactionMenu('asalto_seleccionar_defensor', '🛡️ Equipo 1');
const row1 = new ActionRowBuilder().addComponents(selectDefensor);
const row2 = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId('btn_asalto_custom_defensor').setLabel('✍️ Nombre Personalizado').setStyle(ButtonStyle.Secondary)
);
return interaction.update({
content: '🛡️ **Paso 2:** Selecciona la Banda correspondiente al **Equipo 1**.',
components: [row1, row2]
});
}
if (interaction.isStringSelectMenu() && interaction.customId === 'asalto_seleccionar_sede') {
const sedeId = interaction.values[0];
if (sedeId === 'none') return interaction.reply({ content: '❌ No hay sedes disponibles. Agrega una primero con "Gestionar Sedes".', flags: MessageFlags.Ephemeral });
const sedesDb = await PostgresSedesRepository.getAll();
const sedeDb = sedesDb.find(s => s.name === sedeId);
const emojiKey = sedeDb ? sedeDb.name.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
const sedeData = sedeDb ? {
  nombre: sedeDb.name,
  emoji: EMOJIS.sedes[emojiKey] || '🏰',
  capacidad: sedeDb.capacidad,
  coords: {
    defensa: sedeDb.coords_defensa,
    ataque: sedeDb.coords_ataque
  }
} : null;
const setup = pendingSetups.get(interaction.user.id) || {};
setup.sedeId = sedeId;
setup.sedeData = sedeData;
setup.isBicicleta = false;
pendingSetups.set(interaction.user.id, setup);
const selectDefensor = await getPaginatedFactionMenu('asalto_seleccionar_defensor', '🛡️ Selección: Defensor');
const row1 = new ActionRowBuilder().addComponents(selectDefensor);
const row2 = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId('btn_asalto_custom_defensor').setLabel('✍️ Nombre Personalizado').setStyle(ButtonStyle.Secondary)
);
return interaction.update({
content: (setup.isBicicleta ? '🛡️ **Paso 2:** Selecciona la facción correspondiente al **Equipo 1**.' : '🛡️ **Paso 2.1:** Selecciona la facción **DEFENSORA**.'),
components: [row1, row2]
});
}
if (interaction.isStringSelectMenu() && interaction.customId === 'asalto_seleccionar_defensor') {
const value = interaction.values[0];
if (value.startsWith('PAGINA_')) {
const page = parseInt(value.split('_').pop());
const setup = pendingSetups.get(interaction.user.id);
const placeholder = (setup && setup.isBicicleta) ? '🛡️ Equipo 1' : '🛡️ Defensor';
const menu = await getPaginatedFactionMenu('asalto_seleccionar_defensor', placeholder, page);
return interaction.update({ components: [new ActionRowBuilder().addComponents(menu), interaction.message.components[1]] });
}
const defensorId = value;
const facciones = await PostgresFaccionesRepository.getAll();
const defensorData = facciones.find(f => f.key === defensorId);
const setup = pendingSetups.get(interaction.user.id);
if (!setup) return interaction.reply({ content: '❌ La sesión de configuración ha expirado.', flags: MessageFlags.Ephemeral });
setup.defensores = defensorData ? { nombre: defensorData.nombre, coordenadas: defensorData.coordenadas, emoji: EMOJIS.facciones[defensorId] || '🏳️' } : null;
const selectAtacante = await getPaginatedFactionMenu('asalto_seleccionar_atacante', setup.isBicicleta ? '⚔️ Equipo 2' : '⚔️ Atacante');
const row1 = new ActionRowBuilder().addComponents(selectAtacante);
const row2 = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId('btn_asalto_custom_atacante').setLabel('✍️ Nombre Personalizado').setStyle(ButtonStyle.Secondary)
);
return interaction.update({
content: (setup.isBicicleta ? '⚔️ **Paso 3:** Selecciona la facción correspondiente al **Equipo 2**.' : '⚔️ **Paso 2.2:** Selecciona la facción **ATACANTE**.'),
components: [row1, row2]
});
}
if (interaction.isModalSubmit() && interaction.customId === 'asalto_custom_defensor_modal') {
const setup = pendingSetups.get(interaction.user.id);
if (!setup) return interaction.reply({ content: 'Sesión expirada.', flags: MessageFlags.Ephemeral });
setup.defensores = {
nombre: interaction.fields.getTextInputValue('custom_name'),
coordenadas: "N/A",
emoji: '✍️'
};
const selectAtacante = await getPaginatedFactionMenu('asalto_seleccionar_atacante', setup.isBicicleta ? '⚔️ Equipo 2' : '⚔️ Atacante');
const row1 = new ActionRowBuilder().addComponents(selectAtacante);
const row2 = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId('btn_asalto_custom_atacante').setLabel('✍️ Nombre Personalizado').setStyle(ButtonStyle.Secondary)
);
const responseData = {
content: setup.isBicicleta ? '⚔️ **Paso 3:** Selecciona la facción correspondiente al **Equipo 2**.' : '⚔️ **Paso 2.2:** Selecciona la facción **ATACANTE**.',
components: [row1, row2],
flags: MessageFlags.Ephemeral
};
try {
if (interaction.isFromMessage()) {
return await interaction.update(responseData);
} else {
return await interaction.reply(responseData);
}
} catch (error) {
if (interaction.replied || interaction.deferred) {
return interaction.followUp(responseData);
} else {
return interaction.reply(responseData);
}
}
}
if (interaction.isStringSelectMenu() && interaction.customId === 'asalto_seleccionar_atacante') {
const value = interaction.values[0];
if (value.startsWith('PAGINA_')) {
const page = parseInt(value.split('_').pop());
const setup = pendingSetups.get(interaction.user.id);
const placeholder = (setup && setup.isBicicleta) ? '⚔️ Equipo 2' : '⚔️ Atacante';
const menu = await getPaginatedFactionMenu('asalto_seleccionar_atacante', placeholder, page);
return interaction.update({ components: [new ActionRowBuilder().addComponents(menu), interaction.message.components[1]] });
}
const atacanteId = value;
const facciones = await PostgresFaccionesRepository.getAll();
const atacanteData = facciones.find(f => f.key === atacanteId);
const setup = pendingSetups.get(interaction.user.id);
if (!setup) return interaction.reply({ content: '❌ La sesión de configuración ha expirado. Por favor, reinicia el proceso.', flags: MessageFlags.Ephemeral });
setup.atacantes = atacanteData ? { nombre: atacanteData.nombre, coordenadas: atacanteData.coordenadas, emoji: EMOJIS.facciones[atacanteId] || '🏳️' } : null;
const modal = new ModalBuilder()
.setCustomId('asalto_setup_modal')
.setTitle(`👥 Configuración de ${setup.isBicicleta ? 'Evento' : 'Asalto'}`);
const capacidadInput = new TextInputBuilder()
.setCustomId('capacidad')
.setLabel('Cantidad (ej. 15, 20)')
.setStyle(TextInputStyle.Short)
.setPlaceholder('NUMERO')
.setRequired(true);
if (setup && setup.sedeData && setup.sedeData.capacidad) {
const match = setup.sedeData.capacidad.toString().match(/\d+/);
if (match) capacidadInput.setValue(match[0]);
}
modal.addComponents(new ActionRowBuilder().addComponents(capacidadInput));
return interaction.showModal(modal);
}
if (interaction.isModalSubmit() && interaction.customId === 'asalto_custom_atacante_modal') {
const setup = pendingSetups.get(interaction.user.id);
if (!setup) return interaction.reply({ content: 'Sesión expirada.', flags: MessageFlags.Ephemeral });
setup.atacantes = {
nombre: interaction.fields.getTextInputValue('custom_name'),
coordenadas: "N/A",
emoji: '✍️'
};
const row = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId('btn_abrir_setup_modal')
.setLabel('⚙️ Configurar Capacidad')
.setStyle(ButtonStyle.Primary)
);
const responseData = {
content: '✅ Nombre de atacante guardado. Haz clic en el botón para finalizar la configuración.',
components: [row],
flags: MessageFlags.Ephemeral
};
if (interaction.isFromMessage()) {
return await interaction.update(responseData);
} else {
return await interaction.reply(responseData);
}
}
if (interaction.isModalSubmit() && interaction.customId === 'asalto_setup_modal') {
let capacidad = interaction.fields.getTextInputValue('capacidad');
if (/^\d+$/.test(capacidad.trim())) {
capacidad = `${capacidad.trim()} vs ${capacidad.trim()}`;
}
const setup = pendingSetups.get(interaction.user.id);
if (!setup) return interaction.reply({ content: '❌ La sesión de configuración ha expirado.', flags: MessageFlags.Ephemeral });
setup.capacidad = capacidad;
setup.staffIds = [interaction.user.id];
const userSelect = new UserSelectMenuBuilder()
.setCustomId('asalto_seleccionar_orgs')
.setPlaceholder('🦁 Selecciona LOS ORGANIZADORES')
.setMinValues(1)
.setMaxValues(10)
.setDefaultUsers(interaction.user.id);
const row = new ActionRowBuilder().addComponents(userSelect);
const row2 = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId('btn_confirmar_staff')
.setLabel('✅ Confirmar Leones')
.setStyle(ButtonStyle.Success)
);
const responseData = {
content: `🦁 **Paso 3:** Selecciona los organizadores y haz clic en confirmar.`,
components: [row, row2],
flags: MessageFlags.Ephemeral
};
try {
if (interaction.isFromMessage()) {
return await interaction.update(responseData);
} else {
return await interaction.reply(responseData);
}
} catch (error) {
if (interaction.replied || interaction.deferred) {
return interaction.followUp(responseData);
} else {
return interaction.reply(responseData);
}
}
}
if (interaction.isModalSubmit() && interaction.customId === 'solicitar_verificacion_modal') {
  const nombreIc = interaction.fields.getTextInputValue('verif_nombre_ic');
  const idInput = interaction.fields.getTextInputValue('verif_id');
  const rangoSelect = new StringSelectMenuBuilder()
    .setCustomId(`verif_select_rango_${interaction.user.id}`)
    .setPlaceholder('Selecciona tu rango')
    .addOptions(
      { label: 'Tester', value: '1482523841862303764', emoji: '🧪' },
      { label: 'Miembro', value: '1482522709564063805', emoji: '👤' },
      { label: 'Sub', value: '1482523331600060538', emoji: '🔰' },
      { label: 'Lid', value: '1482523459518206257', emoji: '⭐' },
      { label: 'Aux', value: '1482523886917517414', emoji: '🛠️' },
      { label: 'ADM', value: '1482522080972111912', emoji: '👑' }
    );
  const row = new ActionRowBuilder().addComponents(rangoSelect);
  return interaction.reply({
    content: `🛡️ **Datos recibidos**\nNombre IC: ${nombreIc}\nID: ${idInput}\n\nSelecciona tu rango:`,
    components: [row],
    flags: MessageFlags.Ephemeral
  });
}
if (interaction.isStringSelectMenu() && interaction.customId.startsWith('verif_select_rango_')) {
  const userId = interaction.customId.replace('verif_select_rango_', '');
  const roleId = interaction.values[0];
  const rangoLabels = {
    '1482523841862303764': 'Tester',
    '1482522709564063805': 'Miembro',
    '1482523331600060538': 'Sub',
    '1482523459518206257': 'Lid',
    '1482523886917517414': 'Aux',
    '1482522080972111912': 'ADM'
  };
  const rangoLabel = rangoLabels[roleId] || roleId;
  const contentLines = interaction.message.content.split('\n');
  let nombreIc = 'N/A';
  let idVal = 'N/A';
  for (const line of contentLines) {
    if (line.startsWith('Nombre IC: ')) nombreIc = line.replace('Nombre IC: ', '').trim();
    if (line.startsWith('ID: ')) idVal = line.replace('ID: ', '').trim();
  }
  const now = new Date();
  const fechaLarga = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fechaCorta = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
  const userObj = await interaction.client.users.fetch(userId).catch(() => null);
  const userTag = userObj ? `${userObj.globalName || userObj.username} (${userObj.username})` : userId;
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📄 Nueva Solicitud de Verificación')
    .setDescription('━━━━━━━━━━━━━━━━━━━━━━')
    .addFields(
      { name: '👤 Usuario', value: `<@${userId}>`, inline: false },
      { name: '📝 Nombre IC', value: nombreIc, inline: true },
      { name: '🆔 ID', value: idVal, inline: true },
      { name: '👤 Equipo', value: '🎉 ENT', inline: true },
      { name: '⭐ Rango', value: rangoLabel, inline: true },
      { name: '🏛️ Tipo', value: 'Staff', inline: true },
      { name: '📅 Fecha', value: fechaLarga, inline: false }
    )
    .setFooter({ text: `ID del usuario: ${userId} • ${fechaCorta}` })
    .setTimestamp();
  const btnAprobar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`verif_aprobar_${userId}_${roleId}`)
      .setLabel('✅ Aceptar')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`verif_rechazar_${userId}`)
      .setLabel('❌ Rechazar')
      .setStyle(ButtonStyle.Danger)
  );
  try {
    const targetChannel = await interaction.client.channels.fetch('1488594798335234058');
    if (targetChannel) {
      await targetChannel.send({ embeds: [embed], components: [btnAprobar] });
    }
  } catch (err) {
    console.error('Error enviando solicitud de verificación al canal:', err);
  }
  return interaction.update({
    content: '✅ **Solicitud enviada correctamente.** Tu verificación será revisada por el staff.',
    components: []
  });
}
if (interaction.isButton() && interaction.customId.startsWith('verif_aprobar_')) {
  const parts = interaction.customId.replace('verif_aprobar_', '').split('_');
  const userId = parts[0];
  const roleId = parts.slice(1).join('_');
  const rangoLabels = {
    '1482523841862303764': 'Tester',
    '1482522709564063805': 'Miembro',
    '1482523331600060538': 'Sub',
    '1482523459518206257': 'Lid',
    '1482523886917517414': 'Aux',
    '1482522080972111912': 'ADM'
  };
  const rangoLabel = rangoLabels[roleId] || roleId;
  const hasPerm = interaction.member.roles.cache.has('1482523886917517414') || interaction.member.roles.cache.has('1482522080972111912');
  if (!hasPerm) {
    return interaction.reply({
      content: '❌ No tienes permisos para aprobar verificaciones. Solo Aux y ADM pueden hacerlo.',
      flags: MessageFlags.Ephemeral
    });
  }
  const embed = interaction.message.embeds[0];
  const fields = embed?.fields || [];
  const nombreIcField = fields.find(f => f.name === '📝 Nombre IC');
  const idField = fields.find(f => f.name === '🆔 ID');
  const nombreIc = nombreIcField ? nombreIcField.value.trim() : 'Usuario';
  const idVal = idField ? idField.value.trim() : '000';
  let nickname;
  if (roleId === '1482522080972111912') {
    nickname = `ADM | 🎆${nombreIc} #BuenaGente`;
  } else {
    const prefixes = {
      '1482523841862303764': 'ENT-T',
      '1482522709564063805': 'ENT',
      '1482523331600060538': 'Sub.ENT',
      '1482523459518206257': 'Lid.ENT',
      '1482523886917517414': 'Aux.ENT'
    };
    const prefix = prefixes[roleId] || 'ENT';
    nickname = `${prefix} | 🎆${nombreIc} | ${idVal}`;
  }
  let nickOk = false;
  let roleOk = false;
  let errors = [];
  try {
    const member = await interaction.guild.members.fetch(userId);
    try {
      await member.setNickname(nickname);
      nickOk = true;
    } catch (err) {
      errors.push(`Nickname: ${err.message}`);
      console.error('Error cambiando nickname:', err.message);
    }
    try {
      await member.roles.add(roleId);
      roleOk = true;
    } catch (err) {
      errors.push(`Rol: ${err.message}`);
      console.error('Error asignando rol (verifica que el rol del bot esté por encima del rol a asignar):', err.message);
    }
  } catch (err) {
    console.error('Error aplicando verificación:', err);
    return interaction.reply({
      content: `❌ Error al aplicar la verificación: ${err.message}`,
      flags: MessageFlags.Ephemeral
    });
  }
  const confirmEmbed = new EmbedBuilder()
    .setColor(nickOk && roleOk ? 0x00FF00 : 0xFFA500)
    .setTitle(nickOk && roleOk ? '✅ Verificación Aprobada' : '⚠️ Verificación Parcial')
    .setDescription('━━━━━━━━━━━━━━━━━━━━━━')
    .addFields(
      { name: '👤 Usuario', value: `<@${userId}>`, inline: false },
      { name: '🔰 Nuevo Nickname', value: `${nickname} ${nickOk ? '✅' : '❌'}`, inline: false },
      { name: '⭐ Rango Asignado', value: `${rangoLabel} ${roleOk ? '✅' : '❌'}`, inline: false },
      { name: '👑 Aprobado por', value: `${interaction.user}`, inline: false }
    )
    .setFooter({ text: `Sistema de Verificación | FiveM Staff` })
    .setTimestamp();
  await interaction.update({ embeds: [confirmEmbed], components: [] });
  try {
    const targetChannel = await interaction.client.channels.fetch('1488594798335234058');
    if (targetChannel) {
      await targetChannel.send({
        content: `✅ <@${userId}> ha sido verificado como **${rangoLabel}** con nickname: \`${nickname}\`\nAprobado por: ${interaction.user}`
      });
    }
  } catch (err) {
    console.error('Error enviando confirmación de verificación al canal:', err);
  }
  return;
}
if (interaction.isButton() && interaction.customId.startsWith('verif_rechazar_')) {
  const userId = interaction.customId.replace('verif_rechazar_', '');
  const hasPerm = interaction.member.roles.cache.has('1482523886917517414') || interaction.member.roles.cache.has('1482522080972111912');
  if (!hasPerm) {
    return interaction.reply({
      content: '❌ No tienes permisos para rechazar verificaciones. Solo Aux y ADM pueden hacerlo.',
      flags: MessageFlags.Ephemeral
    });
  }
  const embed = interaction.message.embeds[0];
  const fields = embed?.description || '';
  const nombreIcMatch = fields.match(/\*\*Nombre IC:\*\*\s*(.+)/);
  const idMatch = fields.match(/\*\*ID:\*\*\s*(.+)/);
  const nombreIc = nombreIcMatch ? nombreIcMatch[1].trim() : 'Usuario';
  const idVal = idMatch ? idMatch[1].trim() : '000';
  const rejectEmbed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('❌ Verificación Rechazada')
    .setDescription('━━━━━━━━━━━━━━━━━━━━━━')
    .addFields(
      { name: '👤 Usuario', value: `<@${userId}>`, inline: false },
      { name: '📝 Nombre IC', value: nombreIc, inline: true },
      { name: '🆔 ID', value: idVal, inline: true },
      { name: '👑 Rechazado por', value: `${interaction.user}`, inline: false }
    )
    .setFooter({ text: `Sistema de Verificación | FiveM Staff` })
    .setTimestamp();
  await interaction.update({ embeds: [rejectEmbed], components: [] });
  try {
    const targetChannel = await interaction.client.channels.fetch('1488594798335234058');
    if (targetChannel) {
      await targetChannel.send({
        content: `❌ La verificación de <@${userId}> (${nombreIc} - ID: ${idVal}) ha sido **rechazada** por ${interaction.user}`
      });
    }
  } catch (err) {
    console.error('Error enviando rechazo de verificación al canal:', err);
  }
  return;
}
if (interaction.isModalSubmit() && interaction.customId.startsWith('rey_ganador_modal_')) {
  const sessionId = interaction.customId.split('_').pop();
  const session = sessionManager.getSession(sessionId);
  if (!session) return interaction.update({ content: 'La sesión ya no existe.', components: [], embeds: [] });

  const winner = interaction.fields.getTextInputValue('rey_ganador_input');

  try {
    const fs = require('fs');
    const path = require('path');
    const idFilePath = path.join(__dirname, '../../id discord.txt');
    if (fs.existsSync(idFilePath)) {
      const targetId = fs.readFileSync(idFilePath, 'utf8').trim();
      const leonesList = session.staff ? session.staff.map(id => `<@${id}>`).join('\n') : 'Sin leones';
      const targetUser = await interaction.client.users.fetch(targetId);
      const now = new Date();
      const fecha = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      if (targetUser) {
        const embedDm = new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle(`🦁 **Rey del Crimen Finalizado**`)
          .setDescription(`👑 **Ganador:** ${winner}\n\n🦁 **Leones:**\n${leonesList}`)
          .setFooter({ text: `📅 ${fecha} • 🕐 ${hora}` });
        await targetUser.send({ embeds: [embedDm] });
      }
    }
  } catch (err) {
    console.error('Error enviando DM de leones:', err);
  }

  if (session.announcementMsgId && session.announcementChannelId) {
    try {
      const channel = await interaction.client.channels.fetch(session.announcementChannelId);
      if (channel) {
        const msg = await channel.messages.fetch(session.announcementMsgId);
        if (msg) await msg.delete();
      }
    } catch (err) {
      console.error('Error borrando mensaje de BR:', err);
    }
  }

  const sedeName = session.sede || 'BR';
  const creator = session.creatorId ? `<@${session.creatorId}>` : 'Desconocido';

  const fs = require('fs');
  const path = require('path');
  const now = new Date();
  const fecha = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth()+1).padStart(2, '0')}/${now.getFullYear()}`;
  const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const finalRCPath = path.join(__dirname, '../../Final Rey del crimen.txt');
  let mensajeFinal = '';
  try {
    if (fs.existsSync(finalRCPath)) {
      mensajeFinal = fs.readFileSync(finalRCPath, 'utf8');
      let sedesQueVan = [];
  if (session.brStatus) {
    const faccionesBr = await getFaccionesBr();
    for (const userId in session.brStatus) {
      for (const facKey in session.brStatus[userId]) {
        if (session.brStatus[userId][facKey] === 'tepeado') {
          const fac = faccionesBr[facKey];
          if (fac && !sedesQueVan.includes(fac.nombre)) {
            sedesQueVan.push(fac.nombre);
          }
        }
      }
    }
  }
  const sedesTexto = sedesQueVan.length > 0 ? sedesQueVan.join(', ') : (session.sede || 'Rey del Crimen');

  mensajeFinal = mensajeFinal
        .replace('15/03/2026', fecha)
        .replace('***♛ GLYZZUP ♛***', `***♛ ${winner.toUpperCase()} ♛***`)
        .replace('23:10', hora)
        .replace('19', sedesTexto);

      if (session.staff && session.staff.length > 0) {
        const leonesList = session.staff.map(id => `<@${id}>`).join('\n');
        mensajeFinal = mensajeFinal.replace(/> \*— Sin registros —\*/, `> ${leonesList}`);
      }
    } else {
      console.log('Archivo no encontrado:', finalRCPath);
    }
  } catch (err) {
    console.error('Error leyendo Final Rey del crimen.txt:', err);
  }

  try {
    const targetChannel = await interaction.client.channels.fetch('1488337822556491939');
    if (targetChannel) {
      await targetChannel.send(mensajeFinal);
    }
    const registroChannel = await interaction.client.channels.fetch('1487871883817914400');
    if (registroChannel) {
      await registroChannel.send(mensajeFinal);
    }
  } catch (err) {
    console.error('Error enviando al canal:', err);
  }

  await interaction.reply({
    content: `✅ **REY DEL CRIMEN FINALIZADO**\n\n👑 **GANADOR:** ${winner}\n📌 Sede: ${sedeName}`,
    flags: MessageFlags.Ephemeral
  });

  await assaultPersistence.saveBrEvent(session, sessionId, { winner });

  sessionManager.deleteSession(sessionId);
  return;
}

if (interaction.isModalSubmit() && interaction.customId.startsWith('asalto_finalizar_modal_')) {
const sessionId = interaction.customId.split('_').pop();
const session = sessionManager.getSession(sessionId);
if (!session) return interaction.update({ content: 'La sesión ya no existe o caducó.', components: [], embeds: [] });
let liderId = interaction.fields.getTextInputValue('lider_id');
if (!liderId || liderId.trim() === '') liderId = '[ID_GANADOR]';
const targetWins = session.isBicicleta ? 3 : 2;
const winnerTeam = session.teamA.points >= targetWins ? session.teamA : session.teamB;
const loserTeam = session.teamA.points >= targetWins ? session.teamB : session.teamA;
const now = new Date();
const d = String(now.getDate()).padStart(2, '0');
const m = String(now.getMonth()+1).padStart(2, '0');
const y = now.getFullYear();
const h = String(now.getHours()).padStart(2, '0');
const _m = String(now.getMinutes()).padStart(2, '0');
let payoutCmd = "";
if (session.isBicicleta) {
payoutCmd = `!additem ${liderId} dinheirosujo 4000000 robabicicleta ${h}:${_m} ${d}/${m}`;
} else if (session.subtype === 'vip') {
payoutCmd = `!additem ${liderId} vipevento1 1 asaltosedevip ${h}:${_m} ${d}/${m}`;
} else {
payoutCmd = `!additem ${liderId} dinheirosujo 7000000 asaltosede ${h}:${_m} ${d}/${m}`;
}
const leonesMap = session.staff.map(id => `<@${id}>`).join(' ');
const flavor = getRandomFlavorText(session.sede, winnerTeam.name, loserTeam.name, session.isBicicleta);
const finalMessage = `\`\`\`text\n${flavor}\n\`\`\``;
const auditText = `**📋 REGISTRO DE ${session.isBicicleta ? 'EVENTO' : 'ASALTO'} FINALIZADO**
\`\`\`text
⚡ Evento: ${session.isBicicleta ? 'Roba la Bicicleta al León' : (session.subtype === 'vip' ? 'Asalto a Sede VIP' : (session.subtype === 'custom' ? 'Asalto a Sede Custom' : 'Asalto a Sede'))}
${session.isBicicleta ? '📍 Lugar' : '🏰 Sede Defendida'}: ${session.sede}
${session.isBicicleta ? '🔵 Equipo 1' : '🛡️ Defensores'}: ${session.initialDefenders}
${session.isBicicleta ? '🔴 Equipo 2' : '⚔️ Atacantes'}: ${session.initialAttackers}
👥 Capacidad: ${session.capacity}
🎯 Total Rondas Jugadas: ${session.currentRound}
📈 Marcador: ${session.teamA.name} ${session.teamA.points}-${session.teamB.points} ${session.teamB.name}
🏆 GANADOR: ${winnerTeam.name}
📅 Fecha: ${d}/${m} ${h}:${_m} ${y}
🦁 Leones: ${leonesMap}
🎁 Premiación:
${payoutCmd}
\`\`\``;
let dbSaveResult = null;
try {
if (!session.isBicicleta) {
dbSaveResult = await assaultPersistence.saveFinishedAssault(session, sessionId);
}
} catch (dbErr) {
console.error('❌ Error guardando registro del asalto:', dbErr);
dbSaveResult = { ok: false, reason: 'error' };
}
sessionManager.deleteSession(sessionId);
await cleanupPublicAnnouncement(session, interaction.client);
await interaction.update({ content: `El panel del ${session.isBicicleta ? 'evento' : 'asalto'} finalizado ha sido cerrado.`, embeds: [], components: [] });
await interaction.followUp({ content: `✅ Panel cerrado correctamente por <@${interaction.user.id}>. Emitiendo registros finales...`, flags: MessageFlags.Ephemeral });
await interaction.followUp({ content: finalMessage, flags: MessageFlags.Ephemeral });
await interaction.followUp({ content: auditText, flags: MessageFlags.Ephemeral });
if (dbSaveResult && dbSaveResult.ok) {
await interaction.followUp({
content:
`✅ **ASALTO REGISTRADO CORRECTAMENTE**\n` +
`📅 **Semana:** ${dbSaveResult.isoYearWeek}\n` +
`🆔 **ID:** ${dbSaveResult.matchId}`,
flags: MessageFlags.Ephemeral
});
} else if (!session.isBicicleta) {
if (dbSaveResult && dbSaveResult.reason === 'local_error') {
await interaction.followUp({
content:
'⚠️ **No se pudo escribir** en la carpeta `LOCALREGISTRO`. Revisa permisos del proyecto o la consola del bot.',
flags: MessageFlags.Ephemeral
});
} else if (dbSaveResult && dbSaveResult.reason === 'error') {
await interaction.followUp({
content: '⚠️ **Error al guardar** el registro del asalto. Revisa la consola del bot.',
flags: MessageFlags.Ephemeral
});
}
}
return;
}
if (interaction.isUserSelectMenu() && interaction.customId === 'asalto_seleccionar_orgs') {
const setup = pendingSetups.get(interaction.user.id);
if (!setup) {
return interaction.reply({ content: '❌ Sesión expirada. Por favor inicia el proceso de nuevo.', flags: MessageFlags.Ephemeral });
}
const selectedUsers = Array.from(interaction.users.values());
const selectedIds = selectedUsers.map(u => u.id);
console.log('📋 Usuarios seleccionados en staff:', selectedIds);
let staffIds = [...selectedIds];
if (!staffIds.includes(interaction.user.id)) {
staffIds.unshift(interaction.user.id);
}
console.log('📋 Staff IDs guardado:', staffIds);
setup.staffIds = staffIds;
const row2 = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId('btn_confirmar_staff')
.setLabel('✅ Confirmar Leones')
.setStyle(ButtonStyle.Success)
);
return interaction.update({
content: `🦁 **Paso 3:** Selecciona los organizadores y haz clic en confirmar.`,
components: [row2]
});
}
if (interaction.isButton() && interaction.customId === 'btn_confirmar_staff') {
const setup = pendingSetups.get(interaction.user.id);
if (!setup) {
return interaction.reply({ content: '❌ Sesión expirada. Por favor inicia el proceso de nuevo.', flags: MessageFlags.Ephemeral });
}
const staffIds = setup.staffIds || [interaction.user.id];
const sessionId = Math.random().toString(36).substring(2, 10).padEnd(8, '0');
const session = sessionManager.createSession(sessionId, {
sede: (setup.sedeData?.nombre || 'Sede Desconocida').toUpperCase(),
defenders: setup.defensores?.nombre || 'Desconocido',
attackers: setup.atacantes?.nombre || 'Desconocido',
capacity: setup.capacidad || '15 vs 15',
staff: staffIds,
isBicicleta: setup.isBicicleta || false,
subtype: setup.subtype || 'normal',
creatorId: interaction.user.id
});
session.subtype = setup.subtype || 'normal';
session.isBicicleta = setup.isBicicleta || false;
session.initialDefenders = setup.defensores?.nombre || 'Desconocido';
session.initialAttackers = setup.atacantes?.nombre || 'Desconocido';
session.sedeCoords = setup.sedeData?.coords || { defensa: "N/A", ataque: "N/A" };
session.defensorCoords = setup.defensores?.coordenadas || "N/A";
session.atacanteCoords = setup.atacantes?.coordenadas || "N/A";
session.history = [];
session.tieRolesSelected = false;
sessionManager.updateSession(sessionId, session);
pendingSetups.delete(interaction.user.id);
const creatorName = interaction.user.globalName || interaction.user.username;
const staffList = staffIds.map(id => `<@${id}>`).join(', ');
const embedPublic = new EmbedBuilder()
.setColor(0xFFA500)
.setAuthor({
name: setup.isBicicleta ? `NUEVO EVENTO REGISTRADO` : `NUEVO ASALTO ${(setup.subtype || 'NORMAL').toUpperCase()} REGISTRADO`,
iconURL: 'https://cdn.discordapp.com/emojis/1053421111624646736.webp'
})
.setTitle(setup.isBicicleta ? `🚲 Evento: **${setup.sedeData?.nombre || 'Evento'}**` : `📌 Sede en Disputa (${(setup.subtype || 'NORMAL').toUpperCase()}): **${session.sede}**`)
.setDescription(
`⚔️ **${session.initialAttackers}** 🆚 **${session.initialDefenders}** 🛡️\n\n` +
`👥 **Formato:** ${session.capacity}\n` +
`🦁 **Leones Cargados:** ${staffList}\n\n` +
(setup.isBicicleta ?
`⚡ **REGLAS RÁPIDAS — EVENTOS** ⚡\n` +
`1️⃣ Prohibido reanimar durante la ronda.\n` +
`2️⃣ No toxicidad ni insultos (0 tolerancia).\n` +
`3️⃣ Sin animaciones de ningún tipo.\n` +
`4️⃣ Fuego permitido sobre la bicicleta.\n` +
`5️⃣ Formato: Al mejor de 5 (BO5).`
:
`⚡ **REGLAS RÁPIDAS — ASALTOS A SEDES** ⚡\n` +
`1️⃣ Defensores no salen del perímetro ni usan sótano.\n` +
`2️⃣ No toxicidad ni dar info estando muerto (/me).\n` +
`3️⃣ Prohibido VDM, disparar cuerpos o animaciones.\n` +
`4️⃣ 1 sniper / equipo, 1 blindado (2 si ≥20 jug).\n` +
`5️⃣ Prohibido usar bugs o exploits → ronda perdida.\n` +
`6️⃣ Abuso de GP: 2 clips intencionales = ronda rival.`
)
)
.setFooter({ text: `Panel ID: #${sessionId.slice(-5)} • Registrado por ${creatorName}`, iconURL: interaction.user.displayAvatarURL() });
const btnVerPanel = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId(`btn_ver_panel_${sessionId}`)
.setLabel(`👁️ Ver Panel de ${creatorName}`)
.setStyle(ButtonStyle.Secondary)
);
await interaction.update({ content: '✅ Organizadores confirmados. Generando panel...', components: [], embeds: [] });
const msg = await interaction.channel.send({ embeds: [embedPublic], components: [btnVerPanel] });
session.announcementMsgId = msg.id;
session.announcementChannelId = msg.channelId;
sessionManager.updateSession(sessionId, session);
return;
}
if (interaction.isButton() && interaction.customId.startsWith('btn_ver_panel_')) {
const sessionId = interaction.customId.split('_').pop();
const session = sessionManager.getSession(sessionId);
if (!session) return interaction.reply({ content: 'El evento ya finalizó o fue cancelado.', flags: MessageFlags.Ephemeral });
const isOwner = interaction.guild && interaction.guild.ownerId === interaction.user.id;
const isAdmin = interaction.member && interaction.member.roles.cache.some(r => r.name === 'ENT.ADM');
const isStaff = session.staff.includes(interaction.user.id);
if (!isStaff && !isOwner && !isAdmin) {
return interaction.reply({ content: '❌ No cuentas con permisos ni eres un organizador asignado a este evento.', flags: MessageFlags.Ephemeral });
}
const embed = createMasterPanelEmbed(session);
return interaction.reply({ embeds: [embed], components: getMasterPanelRows(session, sessionId), flags: MessageFlags.Ephemeral });
}
if (interaction.isButton()) {
const rawId = interaction.customId;
let actionType = rawId;
let sessionId = null;
const parts = rawId.split('_');
if (parts.length > 2 && parts[parts.length - 1].length === 8) {
sessionId = parts.pop();
actionType = parts.join('_');
} else {
return;
}
const session = sessionManager.getSession(sessionId);
if (!session) {
return interaction.reply({
content: '❌ **La sesión ha expirado o el bot se reinició.**\nSi el evento aún está en curso, pide a un administrador que use `/panel_asaltos` para recrearlo o ignora este panel.',
flags: MessageFlags.Ephemeral
});
}
if (actionType === 'btn_aviso_pausa') {
return interaction.reply({
content: '```\n🛑 [ALERTA LEON]\nASALTO PAUSADO POR REVISIÓN\n🛑 MANTENGAN POSICIONES Y DETENGAN EL FUEGO\n🎤 LÍDERES A SOPORTE POR VOZ\n```',
flags: MessageFlags.Ephemeral
});
}
if (actionType === 'btn_aviso_5m') {
return interaction.reply({
content: `\`\`\`\n⏳ [AVISO]\n5 MINUTOS PARA PREPARARSE\n⚔️ ENFRENTAMIENTO: ${session.teamA.name} vs ${session.teamB.name}\n🛡️ PREPAREN ARMAMENTO Y POSICIONES\n\`\`\``,
flags: MessageFlags.Ephemeral
});
}
if (actionType === 'btn_aviso_objetivo') {
return interaction.reply({
content: '```\n🎯 Objetivo:\nLa bicicleta aparece en el centro del mapa. Los jugadores deben tomarla y llevarla hasta la esquina de su equipo para ganar la ronda. 🏁\n```',
flags: MessageFlags.Ephemeral
});
}
if (actionType === 'btn_aviso_reglas') {
if (session.isBicicleta) {
return interaction.reply({
content: '```\n📜 [REGLAS DEL EVENTO]\n🚫 NO reanimar | 🔇 0 Toxicidad | 🧍 Sin animaciones\n💥 Fuego permitido sobre la bicicleta\n🏆 Formato: BO5 (Mejor de 5)\n```',
flags: MessageFlags.Ephemeral
});
}
return interaction.reply({
content: '```\n📜 [REGLAS DE ASALTO]\n🚫 NO reanimar | 🔇 0 Toxicidad | 🧍 Sin animaciones\n📍 Respetar límites | 🚗 VEHÍCULOS: SOLO ATACANTES\n```',
flags: MessageFlags.Ephemeral
});
}
if (actionType === 'btn_aviso_inicio') {
if (session.isBicicleta) {
return interaction.reply({
content: `\`\`\`\n🔥 [INICIO DE RONDA ${session.currentRound}]\n📍 EVENTO: BICICLETA | 🏆 BO5\n⚔️ ENFRENTAMIENTO: ${session.teamA.name} vs ${session.teamB.name}\n🏁 ¡A POR LA BICICLETA!\n\`\`\``,
flags: MessageFlags.Ephemeral
});
}
const def = session.teamA.role === 'Defensa' ? session.teamA.name : session.teamB.name;
const atk = session.teamA.role === 'Ataque' ? session.teamA.name : session.teamB.name;
return interaction.reply({
content: `\`\`\`\n🔥 [INICIO DE RONDA ${session.currentRound}]\n📍 SEDE: ${session.sede} | 🛡️ DEF: ${def} | ⚔️ ATK: ${atk}\n⚠️ ATENCIÓN: PROHIBIDO REANIMAR\n\`\`\``,
flags: MessageFlags.Ephemeral
});
}
if (actionType === 'btn_refrescar') {
const embed = createMasterPanelEmbed(session);
return interaction.update({ embeds: [embed], components: getMasterPanelRows(session, sessionId) });
}
if (actionType === 'btn_cancelar') {
const targetWins = session.isBicicleta ? 3 : 2;
const isFinished = session.teamA.points >= targetWins || session.teamB.points >= targetWins;
if (isFinished) {
const modal = new ModalBuilder()
.setCustomId(`asalto_finalizar_modal_${sessionId}`)
.setTitle(session.isBicicleta ? '🏆 Finalizar Evento y Recompensar' : '🏆 Finalizar Asalto y Recompensar');
const idInput = new TextInputBuilder()
.setCustomId('lider_id')
.setLabel('ID del Lider Ganador (Opcional)')
.setStyle(TextInputStyle.Short)
.setPlaceholder('Ej: 512')
.setRequired(false);
modal.addComponents(new ActionRowBuilder().addComponents(idInput));
return interaction.showModal(modal);
} else {
await cleanupPublicAnnouncement(session, interaction.client);
sessionManager.deleteSession(sessionId);
await interaction.update({ content: 'El evento ha sido cancelado.', embeds: [], components: [] });
return interaction.followUp({ content: `❌ Evento cancelado por <@${interaction.user.id}>.`, flags: MessageFlags.Ephemeral });
}
}
if (actionType === 'btn_deshacer') {
if (session.history && session.history.length > 0) {
const lastState = session.history.pop();
session.teamA.points = lastState.pointsA;
session.teamB.points = lastState.pointsB;
session.teamA.role = lastState.roleA;
session.teamB.role = lastState.roleB;
session.currentRound = lastState.currentRound;
session.tieRolesSelected = lastState.tieRolesSelected;
sessionManager.updateSession(sessionId, session);
const embed = createMasterPanelEmbed(session);
return interaction.update({ embeds: [embed], components: getMasterPanelRows(session, sessionId) });
} else {
return interaction.reply({ content: 'No hay más acciones en el historial para deshacer.', flags: MessageFlags.Ephemeral });
}
}
if (actionType === 'btn_win_a' || actionType === 'btn_win_b') {
if (!session.history) session.history = [];
session.history.push({
pointsA: session.teamA.points,
pointsB: session.teamB.points,
roleA: session.teamA.role,
roleB: session.teamB.role,
currentRound: session.currentRound,
tieRolesSelected: session.tieRolesSelected || false
});
const winnerTeam = actionType === 'btn_win_a' ? session.teamA : session.teamB;
const loserTeam = actionType === 'btn_win_a' ? session.teamB : session.teamA;
const targetWins = session.isBicicleta ? 3 : 2;
winnerTeam.points += 1;
if (winnerTeam.points >= targetWins) {
sessionManager.updateSession(sessionId, session);
const embed = createMasterPanelEmbed(session);
await interaction.update({ embeds: [embed], components: getMasterPanelRows(session, sessionId) });
const reportWin = `\`\`\`text\n👑 ${session.isBicicleta ? 'EVENTO' : 'ASALTO'} FINALIZADO - VICTORIA\n\n🏆 GANADOR: ${winnerTeam.name}\n📌 ${session.isBicicleta ? 'EVENTO: BICICLETA' : `SEDE: ${session.sede}`}\n📈 MARCADOR FINAL: ${session.teamA.points} - ${session.teamB.points}\n\`\`\``;
await interaction.followUp({ content: reportWin, flags: MessageFlags.Ephemeral });
return interaction.followUp({ content: `⭐ **MARCADOR FINAL ALCANZADO (${targetWins} Victorias)**\nPor favor, verifica el panel y presiona **✅ ${session.isBicicleta ? 'Finalizar Evento' : 'Dar por finalizado el asalto'}** para emitir los registros copiables y cerrar el evento.`, flags: MessageFlags.Ephemeral });
} else if (!session.isBicicleta && session.teamA.points === 1 && session.teamB.points === 1) {
session.currentRound += 1;
session.tieRolesSelected = false;
sessionManager.updateSession(sessionId, session);
const embed = createMasterPanelEmbed(session);
await interaction.update({ embeds: [embed], components: getMasterPanelRows(session, sessionId) });
await interaction.followUp({ content: `\`\`\`\n🔥 ¡RONDA ${session.currentRound - 1} FINALIZADA!\n\n🏆 Ganador de la Ronda: ${winnerTeam.name}\n📈 Marcador Global: ${session.teamA.name} ${session.teamA.points} - ${session.teamB.points} ${session.teamB.name}\n\`\`\``, flags: MessageFlags.Ephemeral });
return interaction.followUp({ content: `\`\`\`\n⚖️ ¡DESEMPATE! (1-1)\nLíderes, tiren dados para decidir los roles de la Ronda 3\n\`\`\``, flags: MessageFlags.Ephemeral });
} else {
session.currentRound += 1;
if (!session.isBicicleta) {
sessionManager.swapRoles(sessionId);
}
const embed = createMasterPanelEmbed(session);
await interaction.update({ embeds: [embed], components: getMasterPanelRows(session, sessionId) });
return interaction.followUp({ content: `\`\`\`\n🔥 ¡RONDA ${session.currentRound - 1} FINALIZADA!\n\n🏆 Ganador de la Ronda: ${winnerTeam.name}\n📈 Marcador Global: ${session.teamA.name} ${session.teamA.points} - ${session.teamB.points} ${session.teamB.name}\n\`\`\``, flags: MessageFlags.Ephemeral });
}
}
if (actionType === 'btn_tie_atk_a' || actionType === 'btn_tie_atk_b') {
if (!session.history) session.history = [];
session.history.push({
pointsA: session.teamA.points,
pointsB: session.teamB.points,
roleA: session.teamA.role,
roleB: session.teamB.role,
currentRound: session.currentRound,
tieRolesSelected: session.tieRolesSelected || false
});
if (actionType === 'btn_tie_atk_a') {
session.teamA.role = 'Ataque';
session.teamB.role = 'Defensa';
} else {
session.teamA.role = 'Defensa';
session.teamB.role = 'Ataque';
}
session.tieRolesSelected = true;
sessionManager.updateSession(sessionId, session);
const embed = createMasterPanelEmbed(session);
await interaction.update({ embeds: [embed], components: getMasterPanelRows(session, sessionId) });
return interaction.followUp({ content: `✅ Roles asignados para la Ronda 3.`, flags: MessageFlags.Ephemeral });
}
if (actionType === 'btn_add_staff') {
const userSelect = new UserSelectMenuBuilder()
.setCustomId(`asalto_add_staff_select_${sessionId}`)
.setPlaceholder('Selecciona el nuevo León a invitar')
.setMinValues(1)
.setMaxValues(1);
const row = new ActionRowBuilder().addComponents(userSelect);
return interaction.reply({
content: '🦁 Selecciona al staff que deseas invitar a este panel:',
components: [row],
flags: MessageFlags.Ephemeral
});
}
if (actionType === 'btn_ver_staff') {
const staffList = session.staff.map(id => `<@${id}>`).join('\n');
return interaction.reply({
content: `🦁 **Leones del Asalto:**\n${staffList}`,
flags: MessageFlags.Ephemeral
});
}
}
if (interaction.isUserSelectMenu() && interaction.customId.startsWith('asalto_add_staff_select_')) {
const sessionId = interaction.customId.split('_').pop();
let session = sessionManager.getSession(sessionId);
if (!session) return interaction.update({ content: 'No hay ninguna sesión activa.', components: [] });
const newUsers = Array.from(interaction.users.values());
const validStaff = newUsers.filter(u => !u.bot && !session.staff.includes(u.id)).map(u => u.id);
if (validStaff.length > 0) {
const updatedStaff = [...session.staff, ...validStaff];
sessionManager.updateSession(sessionId, { staff: updatedStaff });
session = sessionManager.getSession(sessionId);
const staffList = session.staff.map(id => `<@${id}>`).join(', ');
return interaction.update({
content: `✅ León(es) añadido(s) correctamente.\n🦁 **Staff actual:** ${staffList}\n\n*Usa "Refrescar" para actualizar la vista del panel.*`,
components: []
});
}
}
} catch (error) {
console.error(`❌ Error en panelInteractions: ${error.message}`, error);
const errorMsg = `❌ Ocurrió un error interno al procesar esta acción.\n**Error:** \`${error.message}\``;
if (!interaction.replied && !interaction.deferred) {
await interaction.reply({ content: errorMsg, flags: MessageFlags.Ephemeral });
} else {
await interaction.followUp({ content: errorMsg, flags: MessageFlags.Ephemeral });
}
}
}
};
/**
* Borra el mensaje de anuncio público ("Ver Panel") para mantener el canal limpio.
*/
async function cleanupPublicAnnouncement(session, client) {
if (!session || !session.announcementMsgId || !session.announcementChannelId) return;
try {
const channel = await client.channels.fetch(session.announcementChannelId);
if (channel) {
const msg = await channel.messages.fetch(session.announcementMsgId);
if (msg) {
await msg.delete().catch(() => {});
}
}
} catch (e) {
}
}
