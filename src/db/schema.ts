import { sql } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, unique, uniqueIndex } from "drizzle-orm/pg-core";

export const guilds = pgTable("guilds", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const streamAlerts = pgTable("stream_alerts", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    guildId: text("guild_id").notNull().references(() => guilds.id, { onDelete: "cascade" }),
    twitchUserId: text("twitch_user_id").notNull(),
    twitchLogin: text("twitch_login").notNull(),
    channelId: text("channel_id").notNull(),
    // null means the default template
    messageTemplate: text("message_template"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
    unique().on(t.guildId, t.twitchUserId, t.channelId),
    index().on(t.twitchUserId),
]);

export const liveSessions = pgTable("live_sessions", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    // null once the alert is removed, the session is still closed when the stream ends
    alertId: integer("alert_id").references(() => streamAlerts.id, { onDelete: "set null" }),
    // copied from the alert so the message can still be found if the alert changes or is removed mid-stream
    broadcasterId: text("broadcaster_id").notNull(),
    channelId: text("channel_id").notNull(),
    messageId: text("message_id").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
}, (t) => [
    // at most one open session per alert
    uniqueIndex().on(t.alertId).where(sql`${t.endedAt} is null`),
]);

export type StreamAlert = typeof streamAlerts.$inferSelect;
