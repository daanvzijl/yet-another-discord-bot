import { afterEach, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { eq, isNull } from "drizzle-orm";
import { StreamAlertService } from "../../src/core/stream-alerts.ts";
import type { Db } from "../../src/db/client.ts";
import { guilds, liveSessions, streamAlerts } from "../../src/db/schema.ts";
import { createTestDb } from "../db.ts";
import { FakeNotifier, FakeStreams } from "../fakes.ts";

const event = {
    username: "John",
    broadcasterId: "111",
    title: "coding session",
    game: "Just Chatting",
    thumbnailUrl: "https://example.com/thumb-{width}x{height}.jpg",
    profileImage: "https://example.com/profile",
};

let db: Db;
let notifier: FakeNotifier;
let streams: FakeStreams;
let service: StreamAlertService;

beforeEach(async () => {
    db = await createTestDb();
    notifier = new FakeNotifier();
    streams = new FakeStreams();
    service = new StreamAlertService(db, notifier, streams);

    await db.insert(guilds).values([{ id: "g1", name: "Guild 1" }, { id: "g2", name: "Guild 2" }]);
    await db.insert(streamAlerts).values([
        { guildId: "g1", twitchUserId: "111", twitchLogin: "john", channelId: "c1" },
        { guildId: "g2", twitchUserId: "111", twitchLogin: "john", channelId: "c2", messageTemplate: "{username} is streaming {game}" },
        { guildId: "g2", twitchUserId: "222", twitchLogin: "jane", channelId: "c2" },
        { guildId: "g2", twitchUserId: "333", twitchLogin: "off", channelId: "c2", enabled: false },
    ]);
});

// failures are logged and skipped, silence them so the test output stays readable
const silenceErrors = () => spyOn(console, "error").mockImplementation(() => {});
afterEach(() => mock.restore());

const openSessions = () => db.select().from(liveSessions).where(isNull(liveSessions.endedAt));

test("watches each enabled broadcaster once", async () => {
    expect((await service.watchedBroadcasters()).toSorted()).toEqual(["111", "222"]);
});

test("going live notifies every guild with an alert for the broadcaster, using its template", async () => {
    await service.handleOnline(event);

    expect(notifier.liveCalls.map((c) => [c.channelId, c.content])).toEqual(expect.arrayContaining([
        ["c1", expect.stringContaining("**John** is live")],
        ["c2", "John is streaming Just Chatting"],
    ]));
    expect(notifier.liveCalls).toHaveLength(2);
    expect(await openSessions()).toHaveLength(2);
});

test("a disabled alert doesn't post", async () => {
    await service.handleOnline({ ...event, broadcasterId: "333", username: "Off" });

    expect(notifier.liveCalls).toHaveLength(0);
    expect(await openSessions()).toHaveLength(0);
});

test("a duplicate online event doesn't post again", async () => {
    await service.handleOnline(event);
    await service.handleOnline(event);

    expect(notifier.liveCalls).toHaveLength(2);
});

test("simultaneous duplicate online events post once", async () => {
    await Promise.all([service.handleOnline(event), service.handleOnline(event)]);

    expect(notifier.liveCalls).toHaveLength(2);
    expect(await openSessions()).toHaveLength(2);
});

test("a stream is still closed after its alert was removed", async () => {
    await service.handleOnline(event);
    await db.delete(streamAlerts).where(eq(streamAlerts.channelId, "c1"));

    await service.handleOffline("111");

    expect(notifier.offlineCalls.map((r) => r.channelId).toSorted()).toEqual(["c1", "c2"]);
    expect(await openSessions()).toHaveLength(0);
});

test("one failing guild doesn't block the others", async () => {
    notifier.failingChannels.add("c1");
    const errors = silenceErrors();

    await service.handleOnline(event);

    expect(errors).toHaveBeenCalledTimes(1);
    expect(notifier.liveCalls.map((c) => c.channelId)).toEqual(["c2"]);
    expect(await openSessions()).toHaveLength(1);
});

test("going offline updates the messages and closes the sessions", async () => {
    await service.handleOnline(event);
    await service.handleOffline("111");

    expect(notifier.offlineCalls.map((r) => r.messageId).toSorted()).toEqual(["msg-1", "msg-2"]);
    expect(await openSessions()).toHaveLength(0);
});

test("a session is closed even when the offline message can't be edited", async () => {
    await service.handleOnline(event);
    notifier.failingChannels.add("c1");
    const errors = silenceErrors();

    await service.handleOffline("111");

    expect(errors).toHaveBeenCalledTimes(1);
    expect(await openSessions()).toHaveLength(0);
});

test("refreshing updates live streams and closes ended ones", async () => {
    await service.handleOnline(event);
    await service.handleOnline({ ...event, broadcasterId: "222", username: "Jane" });
    streams.live.set("111", { title: "new title", game: "Chess", thumbnailUrl: "" });

    await service.refreshLiveSessions();
    await service.refreshLiveSessions();

    expect(notifier.updateCalls).toHaveLength(4);
    expect(notifier.updateCalls.every((c) => c.status.title === "new title")).toBe(true);
    expect(notifier.offlineCalls).toHaveLength(1);
    expect(await openSessions()).toHaveLength(2);
});

test("a single missed refresh doesn't close the session", async () => {
    await service.handleOnline(event);

    await service.refreshLiveSessions();
    streams.live.set("111", { title: "back", game: "Chess", thumbnailUrl: "" });
    await service.refreshLiveSessions();
    streams.live.delete("111");
    await service.refreshLiveSessions();

    expect(notifier.offlineCalls).toHaveLength(0);
    expect(await openSessions()).toHaveLength(2);
});
