import { EmbedBuilder, TextChannel, type Message } from "discord.js";
import type { StreamNotifier } from "../interfaces/notifier.ts";
import type { DiscordClient } from "./client.ts";

export class DiscordNotifier implements StreamNotifier<Message> {
    constructor(
        private readonly client: DiscordClient,
        private readonly channelId: string,
        private readonly messageTemplate: string,
    ) {}

    async notifyGoLive(username: string, title: string, game: string, profileImage: string): Promise<Message> {
        const channel = await this.client.raw.channels.fetch(this.channelId);
        if (!channel || !(channel instanceof TextChannel)) throw new Error(`Channel ${this.channelId} not found or not a text channel`);

        const content = this.messageTemplate
            .replace(/\\n/g, "\n")
            .replace(/{username}/g, username)
            .replace(/{title}/g, title)
            .replace(/{game}/g, game);

        const embed = new EmbedBuilder()
            .setColor(0xABC39B)
            .setAuthor({ name: `${username} is live on Twitch!` })
            .setTitle(title)
            .setURL(`https://twitch.tv/${username}`)
            .addFields({ name: "Game", value: game, inline: true })
            .setImage(profileImage)
            .setTimestamp();

        return channel.send({ content, embeds: [embed] });
    }

    async notifyUpdate(message: Message, title: string, game: string, thumbnailUrl: string, startedAt: Date): Promise<void> {
        const original = message.embeds[0];
        const elapsed = this.formatElapsed(startedAt);

        const embed = new EmbedBuilder()
            .setColor(0xABC39B)
            .setAuthor({ name: original?.author?.name ?? "Stream" })
            .setTitle(title)
            .setURL(original?.url ?? "")
            .addFields(
                { name: "Game", value: game, inline: true },
                { name: "Live for", value: elapsed, inline: true },
            )
            .setImage(thumbnailUrl ? `${thumbnailUrl.replace("{width}", "1280").replace("{height}", "720")}?t=${Date.now()}` : null)
            .setTimestamp(startedAt)
            .setFooter({ text: "Stream started" });

        await message.edit({ embeds: [embed] });
    }

    async notifyGoOffline(message: Message): Promise<void> {
        const fetched = await message.fetch();
        const original = fetched.embeds[0];
        if (!original) return;

        const embed = EmbedBuilder.from(original)
            .setAuthor({ name: original.author?.name?.replace("is live on Twitch!", "was live on Twitch!") ?? "Stream" })
            .setImage(null);

        await fetched.edit({ content: fetched.content, embeds: [embed] });
    }

    private formatElapsed(startedAt: Date): string {
        const totalSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
}
