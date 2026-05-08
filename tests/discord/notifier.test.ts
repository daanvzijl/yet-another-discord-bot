import { expect, test } from "bun:test";
import { FakeNotifier } from "../fakes.ts";

test("notifyGoLive records the call", async () => {
    const notifier = new FakeNotifier();

    const handle = await notifier.notifyGoLive("testUser", "lorem ipsum", "dolor sit amet", "https://example.com/profile");

    expect(notifier.calls).toHaveLength(1);
    expect(notifier.calls[0]).toEqual({
        username: "testUser",
        title: "lorem ipsum",
        game: "dolor sit amet",
        profileImage: "https://example.com/profile",
    });
    expect(handle).toBe("handle:testUser");
});

test("notifyUpdate records the call", async () => {
    const notifier = new FakeNotifier();
    const startedAt = new Date();

    const handle = await notifier.notifyGoLive("testUser", "lorem ipsum", "dolor sit amet", "https://example.com/profile");
    await notifier.notifyUpdate(handle, "new title", "new game", "https://example.com/thumb", startedAt);

    expect(notifier.updateCalls).toHaveLength(1);
    expect(notifier.updateCalls[0]).toMatchObject({
        handle: "handle:testUser",
        title: "new title",
        game: "new game",
        thumbnailUrl: "https://example.com/thumb",
        startedAt,
    });
});

test("notifyGoOffline records the call", async () => {
    const notifier = new FakeNotifier();

    const handle = await notifier.notifyGoLive("testUser", "lorem ipsum", "dolor sit amet", "https://example.com/profile");
    await notifier.notifyGoOffline(handle);

    expect(notifier.offlineCalls).toHaveLength(1);
    expect(notifier.offlineCalls[0]).toBe("handle:testUser");
});
