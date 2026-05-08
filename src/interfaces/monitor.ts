export interface StreamEvent {
    username: string;
    broadcasterId: string;
    title: string;
    game: string;
    thumbnailUrl: string;
    profileImage: string;
}

export interface StreamMonitor {
    onStreamOnline(channelName: string, handler: (event: StreamEvent) => Promise<void>): Promise<void>;
    onStreamOffline(channelName: string, handler: () => Promise<void>): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
