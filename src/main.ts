import { config } from "./config.ts";
import { DiscordClient } from "./discord/client.ts";
import { DiscordNotifier } from "./discord/notifier.ts";
import { TwitchEventSubMonitor } from "./twitch/eventsub.ts";

const discord = new DiscordClient(config.discord);
await discord.connect();

const notifier = new DiscordNotifier(discord, config.discord.liveChannelId, config.discord.liveMessage);
const monitor = new TwitchEventSubMonitor(config.twitch);

await monitor.onStreamOnline(config.twitch.channelName, async (event) => {
    await notifier.notifyGoLive(event.username, event.title, event.game, event.profileImage);
    console.log(`${event.username} went live — ${event.title} (${event.game})`);
});

await monitor.start();
