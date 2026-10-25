import { beforeEach, expect, test } from "bun:test";
import { AlertService } from "../../src/core/alerts.ts";
import type { Db } from "../../src/db/client.ts";
import { guilds } from "../../src/db/schema.ts";
import { createTestDb } from "../db.ts";
import { FakeLookup } from "../fakes.ts";

let db: Db;
let lookup: FakeLookup;
let alerts: AlertService;

beforeEach(async () => {
    db = await createTestDb();
    lookup = new FakeLookup();
    lookup.twitchUsers.set("john", { id: "111", login: "john" });
    lookup.channels.set("c1", { id: "c1", guildId: "g1", guildName: "John's server" });
    alerts = new AlertService(db, lookup);
});

test("creates an alert and its guild from the lookups", async () => {
    const alert = await alerts.create({ twitchLogin: "John", channelId: "c1" });

    expect(alert).toMatchObject({ guildId: "g1", twitchUserId: "111", twitchLogin: "john", channelId: "c1", messageTemplate: null, enabled: true });
    expect(await db.select().from(guilds)).toMatchObject([{ id: "g1", name: "John's server" }]);
    expect(await alerts.isEmpty()).toBe(false);
});

test("rejects unknown Twitch users and channels", async () => {
    expect(alerts.create({ twitchLogin: "nobody", channelId: "c1" })).rejects.toThrow("Twitch user not found");
    expect(alerts.create({ twitchLogin: "john", channelId: "nope" })).rejects.toThrow("Discord channel not found");
    expect(await alerts.isEmpty()).toBe(true);
});

test("rejects a duplicate alert", async () => {
    await alerts.create({ twitchLogin: "john", channelId: "c1" });
    expect(alerts.create({ twitchLogin: "john", channelId: "c1" })).rejects.toThrow();
});

test("removes an alert", async () => {
    const alert = await alerts.create({ twitchLogin: "john", channelId: "c1" });

    expect(await alerts.remove(alert.id)).toBe(true);
    expect(await alerts.remove(alert.id)).toBe(false);
    expect(await alerts.list()).toEqual([]);
});
