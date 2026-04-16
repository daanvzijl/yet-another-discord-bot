import { expect, test } from "bun:test";
import { FakeNotifier, FakeMonitor } from "../fakes.ts";

test("notifies when stream goes online", async () => {
    const notifier = new FakeNotifier();
    const monitor = new FakeMonitor();

    await monitor.onStreamOnline("Teleqraph", async (event) => {
        await notifier.notifyGoLive(event.username, event.title, event.game, event.profileImage);
    });

    await monitor.simulateOnline({
        username: "Teleqraph",
        title: "coding session",
        game: "Just Chatting",
        profileImage: "https://example.com/profile",
    });

    expect(notifier.calls).toHaveLength(1);
    expect(notifier.calls[0]).toEqual({
        username: "Teleqraph",
        title: "coding session",
        game: "Just Chatting",
        profileImage: "https://example.com/profile",
    });
});
