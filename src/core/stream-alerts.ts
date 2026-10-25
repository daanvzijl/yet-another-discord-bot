import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../db/client.ts";
import { liveSessions, streamAlerts } from "../db/schema.ts";
import type { StreamEvent, StreamStatusSource } from "../interfaces/monitor.ts";
import type { StreamNotifier } from "../interfaces/notifier.ts";
import { renderTemplate } from "./template.ts";

// the Twitch API sometimes briefly reports a live stream as offline, so a single miss isn't enough to close it
const MISSES_BEFORE_CLOSING = 2;

export class StreamAlertService {
    private readonly misses = new Map<string, number>();
    private readonly queues = new Map<string, Promise<void>>();

    constructor(
        private readonly db: Db,
        private readonly notifier: StreamNotifier,
        private readonly streams: StreamStatusSource,
    ) {}

    async watchedBroadcasters(): Promise<string[]> {
        const rows = await this.db.selectDistinct({ id: streamAlerts.twitchUserId })
            .from(streamAlerts)
            .where(eq(streamAlerts.enabled, true));
        return rows.map((r) => r.id);
    }

    handleOnline(event: StreamEvent): Promise<void> {
        return this.serialize(event.broadcasterId, () => this.goLive(event));
    }

    handleOffline(broadcasterId: string): Promise<void> {
        return this.serialize(broadcasterId, () => this.goOffline(broadcasterId));
    }

    private async goLive(event: StreamEvent): Promise<void> {
        const alerts = await this.db.select({ alert: streamAlerts, openSessionId: liveSessions.id })
            .from(streamAlerts)
            .leftJoin(liveSessions, and(eq(liveSessions.alertId, streamAlerts.id), isNull(liveSessions.endedAt)))
            .where(and(eq(streamAlerts.twitchUserId, event.broadcasterId), eq(streamAlerts.enabled, true)));

        await this.forEach(alerts, async ({ alert, openSessionId }) => {
            // duplicate online event, or the bot restarted mid-stream
            if (openSessionId !== null) return;

            const content = renderTemplate(alert.messageTemplate, event);
            const ref = await this.notifier.notifyGoLive(alert.channelId, content, event);
            await this.db.insert(liveSessions).values({
                alertId: alert.id,
                broadcasterId: alert.twitchUserId,
                channelId: ref.channelId,
                messageId: ref.messageId,
                startedAt: new Date(),
            });
        }, `go-live for ${event.username}`);
    }

    private async goOffline(broadcasterId: string): Promise<void> {
        this.misses.delete(broadcasterId);
        const sessions = await this.openSessions(broadcasterId);

        await this.forEach(sessions, async (session) => {
            // close first, so a deleted message or missing permission can't keep the session open forever
            await this.db.update(liveSessions).set({ endedAt: new Date() }).where(eq(liveSessions.id, session.id));
            await this.notifier.notifyGoOffline(session);
        }, `go-offline for ${broadcasterId}`);
    }

    /**
     * Refreshes the embeds of all live streams, and closes sessions whose stream has ended.
     * Closing is a fallback for offline events missed while the bot was down.
     */
    async refreshLiveSessions(): Promise<void> {
        const sessions = await this.openSessions();
        const byBroadcaster = Map.groupBy(sessions, (s) => s.broadcasterId);

        for (const [broadcasterId, broadcasterSessions] of byBroadcaster) {
            try {
                const status = await this.streams.getStream(broadcasterId);
                if (!status) {
                    const misses = (this.misses.get(broadcasterId) ?? 0) + 1;
                    if (misses < MISSES_BEFORE_CLOSING) {
                        this.misses.set(broadcasterId, misses);
                        continue;
                    }
                    console.log(`${broadcasterId} is no longer live, closing sessions`);
                    await this.handleOffline(broadcasterId);
                    continue;
                }
                this.misses.delete(broadcasterId);
                await this.forEach(broadcasterSessions, (session) => this.notifier.notifyUpdate(session, status, session.startedAt), `update for ${broadcasterId}`);
            } catch (err) {
                console.error("Failed to refresh live sessions for %s:", broadcasterId, err);
            }
        }
    }

    private async openSessions(broadcasterId?: string) {
        return this.db.select({
            id: liveSessions.id,
            channelId: liveSessions.channelId,
            messageId: liveSessions.messageId,
            startedAt: liveSessions.startedAt,
            broadcasterId: liveSessions.broadcasterId,
        })
            .from(liveSessions)
            .where(and(
                isNull(liveSessions.endedAt),
                broadcasterId === undefined ? undefined : eq(liveSessions.broadcasterId, broadcasterId),
            ));
    }

    /** Runs events for the same broadcaster one at a time, so a duplicate event can't post twice. */
    private serialize(broadcasterId: string, action: () => Promise<void>): Promise<void> {
        const run = (this.queues.get(broadcasterId) ?? Promise.resolve()).then(action);
        const queued = run.catch(() => {});
        this.queues.set(broadcasterId, queued);
        void queued.then(() => {
            if (this.queues.get(broadcasterId) === queued) this.queues.delete(broadcasterId);
        });
        return run;
    }

    /** Runs the action for every item, so one failing guild doesn't block the others. */
    private async forEach<T>(items: T[], action: (item: T) => Promise<void>, label: string): Promise<void> {
        const results = await Promise.allSettled(items.map(action));
        for (const result of results) {
            if (result.status === "rejected") console.error("Failed %s:", label, result.reason);
        }
    }
}
