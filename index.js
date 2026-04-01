const http = require("http");
require("dotenv").config();

// ── HTTP server (keep Render alive) ──────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        uptime: process.uptime(),
        confirmedChannel: confirmedChannel,
        inVoice: false,
      })
    );
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
let isConnecting = false;
let isReady = false;

function clearReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function isInVoiceChannel() {
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return false;
  const voiceState = guild.voiceStates.cache.get(client.user.id);
  return !!voiceState?.channelId;
}

async function joinChannel(channelId) {
  clearReconnect();
  if (isConnecting) return;

  if (!channelId) {
    console.log("No channel to join, waiting...");
    return;
  }

  isConnecting = true;

  if (isInVoiceChannel()) {
    console.log("Already in a voice channel, skipping join");
    isConnecting = false;
    return;
  }

  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.log("Guild not cached yet, waiting 5s...");
    isConnecting = false;
    reconnectTimer = setTimeout(() => joinChannel(channelId), 5000);
    return;
  }

  const channel = guild.channels.cache.get(channelId);
  if (!channel) {
    console.log(
      `Channel ${channelId} not found in cache, waiting 5s...`
    );
    isConnecting = false;
    reconnectTimer = setTimeout(() => joinChannel(channelId), 5000);
    return;
  }

  console.log(`Joining voice channel: ${channel.name || channelId}`);

  try {
    await client.voice.joinChannel(channel, {
      selfMute: true,
      selfDeaf: true,
      timeout: 30000,
    });
    confirmedChannel = channelId;
    console.log(`✅ Joined: ${channel.name || channelId} (muted)`);
  } catch (err) {
    console.error(`❌ Failed to join: ${err.message}`);
    isConnecting = false;
    reconnectTimer = setTimeout(() => joinChannel(confirmedChannel), 10000);
    return;
  }

  isConnecting = false;
}

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  isReady = true;

  if (!GUILD_ID || !INITIAL_CHANNEL) {
    console.error(
      "❌ Missing GUILD_ID or CHANNEL_ID env vars"
    );
    return;
  }

  joinChannel(INITIAL_CHANNEL);
});

client.on("voiceStateUpdate", (oldState, newState) => {
  if (newState.member?.user.id !== client.user.id) return;

  if (
    newState.channelId &&
    newState.channelId !== oldState?.channelId
  ) {
    const guild = newState.guild;
    const ch = guild.channels.cache.get(newState.channelId);
    confirmedChannel = newState.channelId;
    clearReconnect();
    isConnecting = false;
    console.log(
      `📍 Moved to: ${ch?.name || newState.channelId} (confirmed)`
    );
  } else if (!newState.channelId && oldState?.channelId) {
    console.log(
      `🔌 Disconnected. Rejoining ${confirmedChannel} in 5s...`
    );
    clearReconnect();
    isConnecting = false;
    reconnectTimer = setTimeout(
      () => joinChannel(confirmedChannel),
      5000
    );
  }
});

client.on("disconnect", () => {
  console.log("🔴 Disconnected from Discord. Will reconnect...");
  isReady = false;
});

client.on("reconnecting", () => {
  console.log("🔄 Reconnecting to Discord...");
});

client.on("resume", () => {
  console.log("✅ Reconnected. Rejoining voice...");
  isReady = true;
  joinChannel(confirmedChannel);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

client.login(process.env.DISCORD_TOKEN);
