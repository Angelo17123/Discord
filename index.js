const http = require("http");
require("dotenv").config();

// ── Validación de variables de entorno ────────────────────────────────────────
const REQUIRED_ENV = ["DISCORD_TOKEN", "GUILD_ID"];
const missingVars = REQUIRED_ENV.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error("❌ Faltan variables de entorno obligatorias:");
  missingVars.forEach((v) => console.error(`   - ${v}`));
  console.error(
    "\nCopiá .env.example a .env y configurá los valores correctos."
  );
  process.exit(1);
}

// ── HTTP server (health check para Render/monitoreo) ──────────────────────────
const PORT = process.env.HEALTH_PORT || 3002;
let botReady = false;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: botReady ? "ok" : "starting",
        uptime: process.uptime(),
        botReady,
      })
    );
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot de Entretenimiento Real RP");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Health check server listening on port ${PORT}`);
});

// ── Sentry (monitoreo de errores) ────────────────────────────────────────────
if (process.env.SENTRY_DSN) {
  const Sentry = require("@sentry/node");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: 0.5,
  });
  console.log("✅ Sentry inicializado para monitoreo de errores");
}

// ── Discord Bot (discord.js normal) ──────────────────────────────────────────
const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.slashCommands = new Map();

// ── Cargar handlers y eventos ────────────────────────────────────────────────
const eventHandler = require("./Handlers/eventHandler");
require("./Events/Interaction/panelInteractions");

const sessionManager = require("./managers/sessionManager");

client.once("ready", async () => {
  console.log(`✅ Bot encendido como: ${client.user.tag}`);
  botReady = true;

  await eventHandler.loadEvents(client);

  // Establecer presencia
  client.user.setPresence({
    activities: [{ name: "Real RP", type: 0 }],
    status: "online",
  });
  console.log("🎮 Rich Presence establecido");

  // ── Inicializar PostgreSQL ──────────────────────────────────────────────────
  try {
    const PostgresConnection = require("./src/infrastructure/database/PostgresConnection");
    await PostgresConnection.connect();

    const MigrationService = require("./src/infrastructure/database/postgres/PostgresMigrationService");
    await MigrationService.runAll();

    console.log("✅ PostgreSQL inicializado y migraciones aplicadas");
  } catch (err) {
    console.error("⚠️ PostgreSQL no disponible (las funciones de DB estarán deshabilitadas):", err.message);
  }

  // ── Inicializar API Server + WebSocket ──────────────────────────────────────
  if (process.env.BOT_API_SECRET) {
    const apiServer = require("./src/api/server");
    apiServer.init(client, sessionManager);
    const API_PORT = process.env.API_PORT || 3001;
    await apiServer.start(API_PORT);
    console.log(`✅ API server + WebSocket listados en puerto ${API_PORT}`);
  } else {
    console.log("⚠️ BOT_API_SECRET no configurado — API server deshabilitado");
  }
});

// ── Manejo de interacciones (slash commands) ─────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({
      content: `El comando \`\`${interaction.commandName}\`\` no existe o ha sido eliminado...`,
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(
      `❌ Error al ejecutar el comando \`\`${interaction.commandName}\`\`: ${error.message}`
    );

    const errorMsg = `Ocurrió un error al ejecutar el comando \`\`${interaction.commandName}\`\`. Por favor, inténtalo de nuevo más tarde.`;

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMsg, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    }

    // Capturar error en Sentry si está configurado
    if (process.env.SENTRY_DSN) {
      const Sentry = require("@sentry/node");
      Sentry.captureException(error, {
        tags: { command: interaction.commandName },
        user: { id: interaction.user.id },
      });
    }
  }
});

// ── Reconexión automática ────────────────────────────────────────────────────
client.on("disconnect", () => {
  console.log("🔴 Desconectado de Discord. Reconectando...");
  botReady = false;
});

client.on("reconnecting", () => {
  console.log("🔄 Reconectando a Discord...");
});

client.on("resume", () => {
  console.log("✅ Reconectado a Discord");
  botReady = true;
});

// ── Errores no capturados ───────────────────────────────────────────────────
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled rejection:", err);
  if (process.env.SENTRY_DSN) {
    const Sentry = require("@sentry/node");
    Sentry.captureException(err);
  }
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err);
  if (process.env.SENTRY_DSN) {
    const Sentry = require("@sentry/node");
    Sentry.captureException(err);
  }
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Recibida señal ${signal}. Cerrando bot...`);
  botReady = false;

  // Cerrar servidor HTTP
  server.close(() => {
    console.log("✅ HTTP server cerrado");
  });

  // Cerrar API server si existe
  try {
    const apiServer = require("./src/api/server");
    if (apiServer.server) {
      apiServer.server.close(() => {
        console.log("✅ API server cerrado");
      });
    }
  } catch (err) {
    // API server no inicializado
  }

  // Cerrar pool de PostgreSQL si existe
  try {
    const PostgresConnection = require("./src/infrastructure/database/PostgresConnection");
    if (PostgresConnection.pool) {
      await PostgresConnection.pool.end();
      console.log("✅ Pool de PostgreSQL cerrado");
    }
  } catch (err) {
    console.error("Error cerrando PostgreSQL:", err.message);
  }

  // Desconectar Discord
  client.destroy();
  console.log("✅ Bot desconectado de Discord");

  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ── Login ────────────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);
