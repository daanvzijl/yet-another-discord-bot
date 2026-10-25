export interface TwitchUser {
    id: string;
    login: string;
}

export interface DiscordChannel {
    id: string;
    guildId: string;
    guildName: string;
}

export interface Lookup {
    findTwitchUser(login: string): Promise<TwitchUser | null>;
    findDiscordChannel(channelId: string): Promise<DiscordChannel | null>;
}
