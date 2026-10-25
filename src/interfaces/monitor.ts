export interface StreamStatus {
    title: string;
    game: string;
    thumbnailUrl: string;
}

export interface StreamEvent extends StreamStatus {
    username: string;
    broadcasterId: string;
    profileImage: string;
}

export interface StreamMonitor {
    onStreamOnline(handler: (event: StreamEvent) => Promise<void>): void;
    onStreamOffline(handler: (broadcasterId: string) => Promise<void>): void;
    watch(broadcasterId: string): void;
    start(): Promise<void>;
}

export interface StreamStatusSource {
    getStream(broadcasterId: string): Promise<StreamStatus | null>;
}
