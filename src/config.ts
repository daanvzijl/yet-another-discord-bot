function getEnv(key: string): string {
    const val = process.env[key];
    if (!val) throw new Error(`Missing env var: ${key}`);
    return val;
}

export const config = {
    twitch: {
        clientId: getEnv("TWITCH_CLIENT_ID"),
        clientSecret: getEnv("TWITCH_CLIENT_SECRET"),
        webhookSecret: getEnv("TWITCH_WEBHOOK_SECRET"),
        publicHostname: getEnv("PUBLIC_HOSTNAME"),
        channelName: getEnv("TWITCH_CHANNEL_NAME"),
    },
    discord: {
        token: getEnv("DISCORD_TOKEN"),
        liveChannelId: getEnv("DISCORD_LIVE_CHANNEL_ID"),
        liveMessage: process.env["DISCORD_LIVE_MESSAGE"] ?? "🔴 **{username}** is live — **{title}** ({game})\nhttps://twitch.tv/{username}",
    },
};

export type DiscordConfig = typeof config.discord;
