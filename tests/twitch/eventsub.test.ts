import { expect, test } from "bun:test";
import { FakeNotifier, FakeMonitor } from "../fakes.ts";

const event = {
    username: "John",
    broadcasterId: "01234567",
    title: "coding session",
    game: "Just Chatting",
    thumbnailUrl: "https://example.com/thumb-{width}x{height}.jpg",
    profileImage: "https://example.com/profile",
};

test("notifies when stream goes online", async () => {
    const notifier = new FakeNotifier();
    const monitor = new FakeMonitor();

    await monitor.onStreamOnline("Teleqraph", async (e) => {
        await notifier.notifyGoLive(e.username, e.title, e.game, e.profileImage);
    });

    await monitor.simulateOnline(event);

    expect(notifier.calls).toHaveLength(1);
    expect(notifier.calls[0]).toEqual({
        username: "John",
        title: "coding session",
        game: "Just Chatting",
        profileImage: "https://example.com/profile",
    });
});

test("notifies when stream goes offline", async () => {
    const notifier = new FakeNotifier();
    const monitor = new FakeMonitor();

    let handle: string | null = null;

    await monitor.onStreamOnline("John", async (e) => {
        handle = await notifier.notifyGoLive(e.username, e.title, e.game, e.profileImage);
    });

    await monitor.onStreamOffline("John", async () => {
        if (handle) await notifier.notifyGoOffline(handle);
    });

    await monitor.simulateOnline(event);
    await monitor.simulateOffline();

    expect(notifier.offlineCalls).toHaveLength(1);
    expect(notifier.offlineCalls[0]).toBe("handle:John");
});
