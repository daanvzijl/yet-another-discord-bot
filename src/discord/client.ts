import { Client, GatewayIntentBits } from "discord.js";
import type { DiscordConfig } from "../config.ts";

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
