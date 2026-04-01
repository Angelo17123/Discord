const http = require("http");
require("dotenv").config();

// ── HTTP server (keep Render alive) ──────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Discord voice bot running");
  }
});
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Health check server listening on port ${PORT}`);
});

// ── Discord selfbot ──────────────────────────────────────────────────────────
const { Client } = require("discord.js-selfbot-v13");

const GUILD_ID = process.env.GUILD_ID;
const INITIAL_CHANNEL = process.env.CHANNEL_ID;

const client = new Client();
let confirmedChannel = INITIAL_CHANNEL;
let reconnectTimer = null;
let joinPromise = null;
let isConnecting = false;

function isInVoiceChannel() {
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return false;
  const voiceState = guild.voiceStates.cache.get(client.user.id);
  return !!voiceState?.channelId;
}

function clearReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

async function joinChannel(channelId) {
  clearReconnect();
  if (isConnecting) return;
  isConnecting = true;

  if (isInVoiceChannel()) {
    isConnecting = false;
    return;
  }

  console.log(`Attempting to join channel: ${channelId}`);

  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.log("Guild not found, retrying in 10s...");
    isConnecting = false;
    reconnectTimer = setTimeout(() => joinChannel(channelId), 10000);
    return;
  }

  const channel = guild.channels.cache.get(channelId);
  if (!channel) {
    console.log("Channel not found, retrying in 10s...");
    isConnecting = false;
    reconnectTimer = setTimeout(() => joinChannel(channelId), 10000);
    return;
  }

  try {
    joinPromise = client.voice.joinChannel(channel, {
      selfMute: true,
      selfDeaf: false,
    });
    await joinPromise;
    confirmedChannel = channelId;
    console.log(`Joined voice channel: ${channel.name} (muted)`);
  } catch (err) {
    console.error("Failed to join channel:", err.message);
    isConnecting = false;
    reconnectTimer = setTimeout(() => joinChannel(confirmedChannel), 5000);
    return;
  }

  isConnecting = false;
}

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  joinChannel(INITIAL_CHANNEL);
});

client.on("voiceStateUpdate", (oldState, newState) => {
  if (newState.member?.user.id === client.user.id) {
    if (
      newState.channelId &&
      newState.channelId !== oldState?.channelId
    ) {
      const guild = newState.guild;
      const ch = guild.channels.cache.get(newState.channelId);
      console.log(`Moved to: ${ch?.name || newState.channelId}`);
    } else if (!newState.channelId && oldState?.channelId) {
      console.log(
        `Disconnected from voice. Rejoining confirmed channel in 5s...`
      );
      clearReconnect();
      isConnecting = false;
      reconnectTimer = setTimeout(
        () => joinChannel(confirmedChannel),
        5000
      );
    }
  }
});

client.on("disconnect", () => {
  console.log("Disconnected from Discord. Reconnecting...");
});

client.on("reconnecting", () => {
  console.log("Reconnecting to Discord...");
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

client.login(process.env.DISCORD_TOKEN);
