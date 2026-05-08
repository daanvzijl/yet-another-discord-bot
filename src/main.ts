import { config } from "./config.ts";
import { DiscordClient } from "./discord/client.ts";
import { DiscordNotifier } from "./discord/notifier.ts";
import { TwitchEventSubMonitor } from "./twitch/eventsub.ts";
import { apiClient } from "./twitch/client.ts";
import type { Message } from "discord.js";

const discord = new DiscordClient(config.discord);
await discord.connect();

const notifier = new DiscordNotifier(discord, config.discord.liveChannelId, config.discord.liveMessage);
const monitor = new TwitchEventSubMonitor(config.twitch);

let liveMessage: Message | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;

await monitor.onStreamOnline(config.twitch.channelName, async (event) => {
    const startedAt = new Date();
    liveMessage = await notifier.notifyGoLive(event.username, event.title, event.game, event.profileImage);
    console.log(`${event.username} went live — ${event.title} (${event.game})`);

    intervalId = setInterval(async () => {
        try {
            const stream = await apiClient.streams.getStreamByUserId(event.broadcasterId);
            if (!stream) {
                clearInterval(intervalId!);
                console.log(`${event.username} went offline, stopping updates`);
                return;
            }
            await notifier.notifyUpdate(liveMessage!, stream.title, stream.gameName, stream.thumbnailUrl, startedAt);
        } catch (err) {
            console.error("Failed to update live embed:", err);
        }
    }, config.discord.pollIntervalMs);
});

await monitor.onStreamOffline(config.twitch.channelName, async () => {
    if (intervalId) clearInterval(intervalId);
    if (liveMessage) await notifier.notifyGoOffline(liveMessage);
    console.log(`${config.twitch.channelName} went offline`);
});

await monitor.start();
