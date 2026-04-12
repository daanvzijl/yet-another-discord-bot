export interface StreamNotifier {
    notifyGoLive(username: string, title: string, game: string): Promise<void>;
}
