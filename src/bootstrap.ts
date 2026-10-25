import type { Config } from "./config.ts";
import { AlertService } from "./core/alerts.ts";
import { connectDb } from "./db/client.ts";
import { DiscordLookup } from "./discord/client.ts";
import { createApiClient, TwitchStreams } from "./twitch/client.ts";

/** Wiring shared by the bot and the CLI. */
export async function bootstrap(config: Config) {
    const db = await connectDb(config.databaseUrl);
    const twitchApi = createApiClient(config.twitch);
    const twitchStreams = new TwitchStreams(twitchApi);
    const discordLookup = new DiscordLookup(config.discord);

    const alerts = new AlertService(db, {
        findTwitchUser: (login) => twitchStreams.findUser(login),
        findDiscordChannel: (channelId) => discordLookup.findChannel(channelId),
    });

    return { db, twitchApi, twitchStreams, alerts };
}

/** Imports the pre-database env config (TWITCH_CHANNEL_NAME and DISCORD_LIVE_CHANNEL_ID), once. */
export async function importLegacyConfig(config: Config, alerts: AlertService): Promise<void> {
    if (!config.legacy || !(await alerts.isEmpty())) return;

    const alert = await alerts.create(config.legacy);
    console.log(`Imported legacy config as alert #${alert.id}: ${alert.twitchLogin} → ${alert.channelId}. The legacy env vars can now be removed.`);
}
