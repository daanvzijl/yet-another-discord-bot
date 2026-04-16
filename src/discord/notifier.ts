import {EmbedBuilder, TextChannel} from "discord.js";
import type { StreamNotifier } from "../interfaces/notifier.ts";
import type { DiscordClient } from "./client.ts";

export class DiscordNotifier implements StreamNotifier {
    constructor(
        private readonly client: DiscordClient,
        private readonly channelId: string,
        private readonly messageTemplate: string,
    ) {}

    async notifyGoLive(username: string, title: string, game: string, profileImage: string): Promise<void> {
        const channel = await this.client.raw.channels.fetch(this.channelId);
        if (!channel || !(channel instanceof TextChannel)) return;

        const content = this.messageTemplate
            .replace(/\\n/g, "\n")
            .replace(/{username}/g, username)
            .replace(/{title}/g, title)
            .replace(/{game}/g, game);

        const embed = new EmbedBuilder()
            .setColor(0x9146FF)
            .setAuthor({ name: `${username} is live on Twitch!` })
            .setTitle(title)
            .setURL(`https://twitch.tv/${username}`)
            .addFields({ name: "Game", value: game, inline: true })
            .setImage(profileImage)
            .setTimestamp();

        await channel.send({ content, embeds: [embed] });
    }
}
