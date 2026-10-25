import { bootstrap, importLegacyConfig } from "./bootstrap.ts";
import { loadConfig } from "./config.ts";
import { StreamAlertService } from "./core/stream-alerts.ts";
import { DiscordClient } from "./discord/client.ts";
import { DiscordNotifier } from "./discord/notifier.ts";
import { TwitchEventSubMonitor } from "./twitch/eventsub.ts";

const config = loadConfig();
const { db, twitchApi, twitchStreams, alerts } = await bootstrap(config);
await importLegacyConfig(config.legacy, alerts);

const discord = new DiscordClient(config.discord);
await discord.connect();

const streamAlerts = new StreamAlertService(db, new DiscordNotifier(discord), twitchStreams);
const monitor = new TwitchEventSubMonitor(twitchApi, twitchStreams, config.twitch);

monitor.onStreamOnline((event) => streamAlerts.handleOnline(event));
monitor.onStreamOffline((broadcasterId) => streamAlerts.handleOffline(broadcasterId));
for (const broadcasterId of await streamAlerts.watchedBroadcasters()) {
    monitor.watch(broadcasterId);
}

await monitor.start();

// also picks up streams that were live when the bot restarted, and closes the ones that ended meanwhile
await streamAlerts.refreshLiveSessions();
setInterval(() => void streamAlerts.refreshLiveSessions(), config.pollIntervalMs);
