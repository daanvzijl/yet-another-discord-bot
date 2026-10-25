function getEnv(key: string): string {
    const val = process.env[key];
    if (!val) throw new Error(`Missing env var: ${key}`);
    return val;
}

/** The single-channel setup from before multi-guild support, imported into the database on first start. */
function loadLegacyConfig() {
    const twitchLogin = process.env["TWITCH_CHANNEL_NAME"];
    const channelId = process.env["DISCORD_LIVE_CHANNEL_ID"];
    if (!twitchLogin || !channelId) return undefined;
    return { twitchLogin, channelId, messageTemplate: process.env["DISCORD_LIVE_MESSAGE"] };
}

export function loadConfig() {
    return {
        databaseUrl: getEnv("DATABASE_URL"),
        pollIntervalMs: Number(process.env["DISCORD_POLL_INTERVAL_MS"] ?? 5 * 60 * 1000),
        twitch: {
            clientId: getEnv("TWITCH_CLIENT_ID"),
            clientSecret: getEnv("TWITCH_CLIENT_SECRET"),
            webhookSecret: getEnv("TWITCH_WEBHOOK_SECRET"),
            publicHostname: getEnv("PUBLIC_HOSTNAME"),
        },
        discord: {
            token: getEnv("DISCORD_TOKEN"),
        },
        legacy: loadLegacyConfig(),
    };
}

export type Config = ReturnType<typeof loadConfig>;
export type TwitchConfig = Config["twitch"];
export type DiscordConfig = Config["discord"];
