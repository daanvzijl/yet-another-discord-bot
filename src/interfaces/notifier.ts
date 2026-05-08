export interface StreamNotifier<TMessage = unknown> {
    notifyGoLive(username: string, title: string, game: string, profileImage: string): Promise<TMessage>;
    notifyUpdate(message: TMessage, title: string, game: string, thumbnailUrl: string, startedAt: Date): Promise<void>;
    notifyGoOffline(message: TMessage): Promise<void>;
}
