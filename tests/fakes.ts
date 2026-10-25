import type { DiscordChannel, Lookup, TwitchUser } from "../src/interfaces/lookup.ts";
import type { StreamEvent, StreamStatus, StreamStatusSource } from "../src/interfaces/monitor.ts";
import type { MessageRef, StreamNotifier } from "../src/interfaces/notifier.ts";

export class FakeNotifier implements StreamNotifier {
    readonly liveCalls: { channelId: string; content: string; event: StreamEvent }[] = [];
    readonly updateCalls: { ref: MessageRef; status: StreamStatus; startedAt: Date }[] = [];
    readonly offlineCalls: MessageRef[] = [];
    readonly failingChannels = new Set<string>();
    private nextMessageId = 1;

    async notifyGoLive(channelId: string, content: string, event: StreamEvent): Promise<MessageRef> {
        if (this.failingChannels.has(channelId)) throw new Error(`Missing access to ${channelId}`);
        this.liveCalls.push({ channelId, content, event });
        return { channelId, messageId: `msg-${this.nextMessageId++}` };
    }

    async notifyUpdate(ref: MessageRef, status: StreamStatus, startedAt: Date): Promise<void> {
        this.updateCalls.push({ ref, status, startedAt });
    }

    async notifyGoOffline(ref: MessageRef): Promise<void> {
        if (this.failingChannels.has(ref.channelId)) throw new Error(`Missing access to ${ref.channelId}`);
        this.offlineCalls.push(ref);
    }
}

export class FakeStreams implements StreamStatusSource {
    readonly live = new Map<string, StreamStatus>();

    async getStream(broadcasterId: string): Promise<StreamStatus | null> {
        return this.live.get(broadcasterId) ?? null;
    }
}

export class FakeLookup implements Lookup {
    readonly twitchUsers = new Map<string, TwitchUser>();
    readonly channels = new Map<string, DiscordChannel>();

    async findTwitchUser(login: string): Promise<TwitchUser | null> {
        return this.twitchUsers.get(login.toLowerCase()) ?? null;
    }

    async findDiscordChannel(channelId: string): Promise<DiscordChannel | null> {
        return this.channels.get(channelId) ?? null;
    }
}
