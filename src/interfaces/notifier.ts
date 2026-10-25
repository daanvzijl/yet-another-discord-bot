import type { StreamEvent, StreamStatus } from "./monitor.ts";

export interface MessageRef {
    channelId: string;
    messageId: string;
}

export interface StreamNotifier {
    notifyGoLive(channelId: string, content: string, event: StreamEvent): Promise<MessageRef>;
    notifyUpdate(ref: MessageRef, status: StreamStatus, startedAt: Date): Promise<void>;
    notifyGoOffline(ref: MessageRef): Promise<void>;
}
