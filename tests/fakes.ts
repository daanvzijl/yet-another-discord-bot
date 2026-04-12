import type { StreamMonitor, StreamEvent } from "../src/interfaces/monitor.ts";
import type { StreamNotifier } from "../src/interfaces/notifier.ts";

export class FakeNotifier implements StreamNotifier {
    readonly calls: { username: string; title: string; game: string }[] = [];

    async notifyGoLive(username: string, title: string, game: string): Promise<void> {
        this.calls.push({ username, title, game });
    }
}

export class FakeMonitor implements StreamMonitor {
    private handler?: (event: StreamEvent) => Promise<void>;

    async onStreamOnline(_channelName: string, handler: (event: StreamEvent) => Promise<void>): Promise<void> {
        this.handler = handler;
    }

    async start(): Promise<void> {}
    async stop(): Promise<void> {}

    async simulateOnline(event: StreamEvent): Promise<void> {
        await this.handler?.(event);
    }
}
