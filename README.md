# Discord Voice Bot

Selfbot que se mantiene conectado a un canal de voz.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DISCORD_TOKEN` | Token de tu cuenta de Discord |
| `GUILD_ID` | ID del servidor |
| `CHANNEL_ID` | ID del canal de voz inicial |

## Despliegue en Render

1. Conecta este repositorio como Web Service
2. Configura las variables de entorno arriba
3. El health check está en `/health`
