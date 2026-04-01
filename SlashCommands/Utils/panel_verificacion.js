const { SlashCommandBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel_verificacion')
    .setDescription('Envía el panel de verificación del staff al canal configurado.')
    .setDefaultMemberPermissions(1n << 3n),
  async execute(interaction) {
    const ADMIN_ID = '1279607375137079367';

    try {
      const adminUser = await interaction.client.users.fetch(ADMIN_ID);
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Solicitud de Panel de Verificación')
        .setColor(0x5865F2)
        .setDescription(
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `<@${interaction.user.id}> solicita enviar el panel de verificación al canal configurado.\n\n` +
          `**¿Deseas autorizar esta acción?**\n` +
          `━━━━━━━━━━━━━━━━━━━━━━`
        )
        .addFields(
          { name: '👤 Solicitante', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📅 Fecha', value: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), inline: true }
        )
        .setFooter({ text: `Solicitado por: ${interaction.user.globalName || interaction.user.username} • ID: ${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`verif_panel_aprobar_${interaction.user.id}`)
          .setLabel('✅ Autorizar')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`verif_panel_rechazar_${interaction.user.id}`)
          .setLabel('❌ Rechazar')
          .setStyle(ButtonStyle.Danger)
      );

      await adminUser.send({ embeds: [embed], components: [row] });

      return interaction.reply({
        content: '📨 Solicitud enviada al administrador. Espera su respuesta.',
        flags: MessageFlags.Ephemeral
      });
    } catch (err) {
      console.error('Error enviando DM de autorización:', err);
      return interaction.reply({
        content: '❌ No se pudo enviar la solicitud de autorización.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
