export interface StreamNotifier {
    notifyGoLive(username: string, title: string, game: string, profileImage: string): Promise<void>;
}
