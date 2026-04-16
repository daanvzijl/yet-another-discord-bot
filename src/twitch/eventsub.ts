import { EventSubMiddleware } from "@twurple/eventsub-http";
import express, { type Express } from "express";
import type { StreamMonitor, StreamEvent } from "../interfaces/monitor.ts";
import { config } from "../config.ts";
import { apiClient } from "./client.ts";

async function getStream(broadcasterId: string, retries = 5, delayMs = 2000) {
    for (let i = 0; i < retries; i++) {
        const stream = await apiClient.streams.getStreamByUserId(broadcasterId);
        if (stream) return stream;
        console.log(`Stream not ready, retrying in ${delayMs}ms... (${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return null;
}

export class TwitchEventSubMonitor implements StreamMonitor {
    private readonly app: Express = express();
    private readonly middleware: EventSubMiddleware;

    constructor(private readonly cfg = config.twitch) {
        this.middleware = new EventSubMiddleware({
            apiClient,
            hostName: this.cfg.publicHostname,
            pathPrefix: "/twitch",
            secret: this.cfg.webhookSecret,
        });
    }

    async onStreamOnline(channelName: string, handler: (event: StreamEvent) => Promise<void>): Promise<void> {
        const user = await apiClient.users.getUserByName(channelName);
        if (!user) throw new Error(`Twitch user not found: ${channelName}`);
        console.log("Subscribing for user:", user.id, user.displayName);

        this.middleware.onStreamOnline(user.id, async (event) => {
            console.log(`${event.broadcasterDisplayName} went live`);
            const stream = await getStream(event.broadcasterId);
            await handler({
                username: event.broadcasterDisplayName,
                title: stream?.title || "unknown",
                game: stream?.gameName || "unknown",
                profileImage: user.profilePictureUrl
            });
        });
    }

    async start(): Promise<void> {
        this.app.use((req, _res, next) => {
            console.log(req.method, req.path, req.headers["twitch-eventsub-message-type"]);
            next();
        });

        this.middleware.apply(this.app);

        const existing = await apiClient.eventSub.getSubscriptions();
        for (const sub of existing.data) {
            await apiClient.eventSub.deleteSubscription(sub.id);
        }
        console.log("Cleared", existing.data.length, "subscriptions");

        await new Promise<void>((resolve) => this.app.listen(3000, () => resolve()));
        await this.middleware.markAsReady();
    }

    async stop(): Promise<void> {
        const existing = await apiClient.eventSub.getSubscriptions();
        for (const sub of existing.data) {
            await apiClient.eventSub.deleteSubscription(sub.id);
        }
    }
}
