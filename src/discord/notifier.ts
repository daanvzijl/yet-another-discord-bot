import { ChannelType, EmbedBuilder, type Message, type NewsChannel, type TextChannel } from "discord.js";
import type { StreamEvent, StreamStatus } from "../interfaces/monitor.ts";
import type { MessageRef, StreamNotifier } from "../interfaces/notifier.ts";
import type { DiscordClient } from "./client.ts";

export class DiscordNotifier implements StreamNotifier {
    constructor(private readonly client: DiscordClient) {}

    async notifyGoLive(channelId: string, content: string, event: StreamEvent): Promise<MessageRef> {
        const channel = await this.fetchChannel(channelId);

        const embed = new EmbedBuilder()
            .setColor(0xABC39B)
            .setAuthor({ name: `${event.username} is live on Twitch!` })
            .setTitle(event.title)
            .setURL(`https://twitch.tv/${event.username}`)
            .addFields({ name: "Game", value: event.game, inline: true })
            .setImage(event.profileImage)
            .setTimestamp();

        const message = await channel.send({ content, embeds: [embed] });
        return { channelId, messageId: message.id };
    }

    async notifyUpdate(ref: MessageRef, status: StreamStatus, startedAt: Date): Promise<void> {
        const message = await this.fetchMessage(ref);
        const original = message.embeds[0];
        const elapsed = this.formatElapsed(startedAt);

        const embed = new EmbedBuilder()
            .setColor(0xABC39B)
            .setAuthor({ name: original?.author?.name ?? "Stream" })
            .setTitle(status.title)
            .setURL(original?.url ?? "")
            .addFields(
                { name: "Game", value: status.game, inline: true },
                { name: "Live for", value: elapsed, inline: true },
            )
            .setImage(status.thumbnailUrl ? `${status.thumbnailUrl.replace("{width}", "1280").replace("{height}", "720")}?t=${Date.now()}` : null)
            .setTimestamp(startedAt)
            .setFooter({ text: "Stream started" });

        await message.edit({ embeds: [embed] });
    }

    async notifyGoOffline(ref: MessageRef): Promise<void> {
        const message = await this.fetchMessage(ref);
        const original = message.embeds[0];
        if (!original) return;

        const embed = EmbedBuilder.from(original)
            .setAuthor({ name: original.author?.name?.replace("is live on Twitch!", "was live on Twitch!") ?? "Stream" })
            .setImage(null);

        await message.edit({ content: message.content, embeds: [embed] });
    }

    private async fetchChannel(channelId: string): Promise<TextChannel | NewsChannel> {
        const channel = await this.client.raw.channels.fetch(channelId);
        if (channel?.type !== ChannelType.GuildText && channel?.type !== ChannelType.GuildAnnouncement) {
            throw new Error(`Channel ${channelId} not found or not a text or announcement channel`);
        }
        return channel;
    }

    private async fetchMessage(ref: MessageRef): Promise<Message> {
        const channel = await this.fetchChannel(ref.channelId);
        return channel.messages.fetch(ref.messageId);
    }

    private formatElapsed(startedAt: Date): string {
        const totalSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
}
