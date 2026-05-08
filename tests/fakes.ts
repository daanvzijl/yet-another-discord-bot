import type { StreamMonitor, StreamEvent } from "../src/interfaces/monitor.ts";
import type { StreamNotifier } from "../src/interfaces/notifier.ts";

export class FakeNotifier implements StreamNotifier<string> {
    readonly calls: { username: string; title: string; game: string; profileImage: string }[] = [];
    readonly updateCalls: { handle: string; title: string; game: string; thumbnailUrl: string; startedAt: Date }[] = [];
    readonly offlineCalls: string[] = [];

    async notifyGoLive(username: string, title: string, game: string, profileImage: string): Promise<string> {
        this.calls.push({ username, title, game, profileImage });
        return `handle:${username}`;
    }

    async notifyUpdate(handle: string, title: string, game: string, thumbnailUrl: string, startedAt: Date): Promise<void> {
        this.updateCalls.push({ handle, title, game, thumbnailUrl, startedAt });
    }

    async notifyGoOffline(handle: string): Promise<void> {
        this.offlineCalls.push(handle);
    }
}

export class FakeMonitor implements StreamMonitor {
    private onlineHandler?: (event: StreamEvent) => Promise<void>;
    private offlineHandler?: () => Promise<void>;

    async onStreamOnline(_channelName: string, handler: (event: StreamEvent) => Promise<void>): Promise<void> {
        this.onlineHandler = handler;
    }

    async onStreamOffline(_channelName: string, handler: () => Promise<void>): Promise<void> {
        this.offlineHandler = handler;
    }

    async start(): Promise<void> {}
    async stop(): Promise<void> {}

    async simulateOnline(event: StreamEvent): Promise<void> {
        await this.onlineHandler?.(event);
    }

    async simulateOffline(): Promise<void> {
        await this.offlineHandler?.();
    }
}
