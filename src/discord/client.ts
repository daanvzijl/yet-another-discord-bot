import { Client, GatewayIntentBits, REST, Routes, type APIChannel, type APIGuild } from "discord.js";
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
        const channel = await this.rest.get(Routes.channel(channelId)).catch(() => null) as APIChannel | null;
        if (!channel || !("guild_id" in channel) || !channel.guild_id) return null;

        const guild = await this.rest.get(Routes.guild(channel.guild_id)) as APIGuild;
        return { id: channel.id, guildId: guild.id, guildName: guild.name };
    }
}
