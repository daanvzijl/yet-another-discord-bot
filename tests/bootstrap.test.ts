import { beforeEach, expect, test } from "bun:test";
import { importLegacyConfig } from "../src/bootstrap.ts";
import { AlertService } from "../src/core/alerts.ts";
import { createTestDb } from "./db.ts";
import { FakeLookup } from "./fakes.ts";

const legacy = { twitchLogin: "john", channelId: "c1", messageTemplate: "{username} is live" };

let alerts: AlertService;

beforeEach(async () => {
    const lookup = new FakeLookup();
    lookup.twitchUsers.set("john", { id: "111", login: "john" });
    lookup.twitchUsers.set("jane", { id: "222", login: "jane" });
    lookup.channels.set("c1", { id: "c1", guildId: "g1", guildName: "John's server" });
    alerts = new AlertService(await createTestDb(), lookup);
});

test("imports the legacy config into an empty database", async () => {
    await importLegacyConfig(legacy, alerts);

    expect(await alerts.list()).toMatchObject([{ twitchLogin: "john", channelId: "c1", messageTemplate: "{username} is live" }]);
});

test("doesn't import when alerts already exist", async () => {
    await alerts.create({ twitchLogin: "jane", channelId: "c1" });

    await importLegacyConfig(legacy, alerts);

    expect((await alerts.list()).map((a) => a.twitchLogin)).toEqual(["jane"]);
});

test("does nothing without a legacy config", async () => {
    await importLegacyConfig(undefined, alerts);

    expect(await alerts.isEmpty()).toBe(true);
});
