import { ChannelType, Client, DiscordAPIError, GatewayIntentBits, REST, RESTJSONErrorCodes, Routes, type APIChannel, type APIGuild } from "discord.js";
import type { DiscordConfig } from "../config.ts";
import type { DiscordChannel } from "../interfaces/lookup.ts";

export class DiscordClient {
    readonly raw: Client;

    constructor(private readonly config: DiscordConfig) {
        this.raw = new Client({
            intents: [
                GatewayIntentBits.Guilds,
            ],
        });
    }

    async connect(): Promise<void> {
        await this.raw.login(this.config.token);
    }
}

/** Looks up channels over REST, so it works without a gateway connection (e.g. from the CLI). */
export class DiscordLookup {
    private readonly rest: REST;

    constructor(config: DiscordConfig) {
        this.rest = new REST({ version: "10" }).setToken(config.token);
    }

    async findChannel(channelId: string): Promise<DiscordChannel | null> {
        const channel = await this.fetchChannel(channelId);
        if (!channel || !("guild_id" in channel) || !channel.guild_id) return null;
        if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
            throw new Error(`Channel ${channelId} is a ${ChannelType[channel.type]} channel, alerts need a text or announcement channel`);
        }

        const guild = await this.rest.get(Routes.guild(channel.guild_id)) as APIGuild;
        return { id: channel.id, guildId: guild.id, guildName: guild.name };
    }

    private async fetchChannel(channelId: string): Promise<APIChannel | null> {
        try {
            return await this.rest.get(Routes.channel(channelId)) as APIChannel;
        } catch (err) {
            if (!(err instanceof DiscordAPIError)) throw err;
            if (err.code === RESTJSONErrorCodes.UnknownChannel || err.code === RESTJSONErrorCodes.InvalidFormBodyOrContentType) return null;
            if (err.code === RESTJSONErrorCodes.MissingAccess) {
                throw new Error(`The bot has no access to channel ${channelId}, invite it to the server and allow it to view the channel`);
            }
            throw err;
        }
    }
}
