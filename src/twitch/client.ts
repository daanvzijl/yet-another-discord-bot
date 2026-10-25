import { AppTokenAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import type { TwitchConfig } from "../config.ts";
import type { StreamStatus, StreamStatusSource } from "../interfaces/monitor.ts";
import type { TwitchUser } from "../interfaces/lookup.ts";

export function createApiClient(config: TwitchConfig): ApiClient {
    return new ApiClient({ authProvider: new AppTokenAuthProvider(config.clientId, config.clientSecret) });
}

export class TwitchStreams implements StreamStatusSource {
    constructor(private readonly api: ApiClient) {}

    async getStream(broadcasterId: string): Promise<StreamStatus | null> {
        const stream = await this.api.streams.getStreamByUserId(broadcasterId);
        if (!stream) return null;
        return { title: stream.title, game: stream.gameName, thumbnailUrl: stream.thumbnailUrl };
    }

    /** The stream isn't always available in the API right when the online event arrives. */
    async waitForStream(broadcasterId: string, retries = 5, delayMs = 2000): Promise<StreamStatus | null> {
        for (let i = 0; i < retries; i++) {
            const stream = await this.getStream(broadcasterId);
            if (stream) return stream;
            console.log(`Stream not ready, retrying in ${delayMs}ms... (${i + 1}/${retries})`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        return null;
    }

    async findUser(login: string): Promise<TwitchUser | null> {
        const user = await this.api.users.getUserByName(login);
        return user ? { id: user.id, login: user.name } : null;
    }
}
