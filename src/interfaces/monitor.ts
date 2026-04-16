export interface StreamEvent {
    username: string;
    title: string;
    game: string;
    profileImage: string;
}

export interface StreamMonitor {
    onStreamOnline(channelName: string, handler: (event: StreamEvent) => Promise<void>): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
