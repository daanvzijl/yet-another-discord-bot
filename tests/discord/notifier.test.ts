import { expect, test } from "bun:test";
import { FakeNotifier } from "../fakes.ts";

test("notifyGoLive records the call", async () => {
    const notifier = new FakeNotifier();

    await notifier.notifyGoLive("testUser", "lorem ipsum", "dolor sit amet", "https://example.com/profile");

    expect(notifier.calls).toHaveLength(1);
    expect(notifier.calls[0]).toEqual({
        username: "testUser",
        title: "lorem ipsum",
        game: "dolor sit amet",
        profileImage: "https://example.com/profile",
    });
});
