import { EventSubMiddleware } from "@twurple/eventsub-http";
import type { ApiClient } from "@twurple/api";
import express, { type Express } from "express";
import type { StreamMonitor, StreamEvent } from "../interfaces/monitor.ts";
import type { TwitchConfig } from "../config.ts";
import type { TwitchStreams } from "./client.ts";

const PATH_PREFIX = "/twitch";

export class TwitchEventSubMonitor implements StreamMonitor {
    private readonly app: Express = express();
    private readonly middleware: EventSubMiddleware;
    private readonly subscriptionIds = new Set<string>();
    private onlineHandler: (event: StreamEvent) => Promise<void> = async () => {};
    private offlineHandler: (broadcasterId: string) => Promise<void> = async () => {};

    constructor(
        private readonly api: ApiClient,
        private readonly streams: TwitchStreams,
        private readonly cfg: TwitchConfig,
    ) {
        this.middleware = new EventSubMiddleware({
            apiClient: api,
            hostName: cfg.publicHostname,
            pathPrefix: PATH_PREFIX,
            secret: cfg.webhookSecret,
        });
    }

    onStreamOnline(handler: (event: StreamEvent) => Promise<void>): void {
        this.onlineHandler = handler;
    }

    onStreamOffline(handler: (broadcasterId: string) => Promise<void>): void {
        this.offlineHandler = handler;
    }

    watch(broadcasterId: string): void {
        const online = this.middleware.onStreamOnline(broadcasterId, async (event) => {
            console.log(`${event.broadcasterDisplayName} went live`);
            const [stream, user] = await Promise.all([
                this.streams.waitForStream(event.broadcasterId),
                event.getBroadcaster(),
            ]);
            await this.onlineHandler({
                username: event.broadcasterDisplayName,
                broadcasterId: event.broadcasterId,
                title: stream?.title ?? "unknown",
                game: stream?.game ?? "unknown",
                thumbnailUrl: stream?.thumbnailUrl ?? "",
                profileImage: user.profilePictureUrl,
            });
        });

        const offline = this.middleware.onStreamOffline(broadcasterId, async (event) => {
            console.log(`${event.broadcasterDisplayName} went offline`);
            await this.offlineHandler(event.broadcasterId);
        });

        this.subscriptionIds.add(online.id);
        this.subscriptionIds.add(offline.id);
    }

    async start(): Promise<void> {
        this.app.use((req, _res, next) => {
            console.log(req.method, req.path, req.headers["twitch-eventsub-message-type"]);
            next();
        });

        this.middleware.apply(this.app);

        await new Promise<void>((resolve) => this.app.listen(3000, () => resolve()));
        // resumes existing Twitch subscriptions with a matching callback, and creates the missing ones
        await this.middleware.markAsReady();
        await this.pruneStaleSubscriptions();
    }

    /**
     * Deletes subscriptions pointing at this host that are no longer watched, e.g. after an alert was removed.
     * Subscriptions for other hosts are left alone, as they may belong to another deployment using the same Twitch app.
     */
    private async pruneStaleSubscriptions(): Promise<void> {
        const callbackPrefix = `https://${this.cfg.publicHostname}${PATH_PREFIX}/event/`;
        const existing = await this.api.eventSub.getSubscriptionsPaginated().getAll();

        let pruned = 0;
        for (const sub of existing) {
            const transport = sub._transport;
            if (transport.method !== "webhook" || !transport.callback.startsWith(callbackPrefix)) continue;
            if (this.subscriptionIds.has(transport.callback.slice(callbackPrefix.length))) continue;

            await this.api.eventSub.deleteSubscription(sub.id);
            pruned++;
        }
        console.log(`Watching ${this.subscriptionIds.size / 2} broadcaster(s), pruned ${pruned} stale subscription(s)`);
    }
}
