CREATE TABLE "guilds" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_sessions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "live_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"alert_id" integer NOT NULL,
	"channel_id" text NOT NULL,
	"message_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stream_alerts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stream_alerts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"guild_id" text NOT NULL,
	"twitch_user_id" text NOT NULL,
	"twitch_login" text NOT NULL,
	"channel_id" text NOT NULL,
	"message_template" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stream_alerts_guild_id_twitch_user_id_channel_id_unique" UNIQUE("guild_id","twitch_user_id","channel_id")
);
--> statement-breakpoint
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_alert_id_stream_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."stream_alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_alerts" ADD CONSTRAINT "stream_alerts_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "live_sessions_alert_id_index" ON "live_sessions" USING btree ("alert_id") WHERE "live_sessions"."ended_at" is null;--> statement-breakpoint
CREATE INDEX "stream_alerts_twitch_user_id_index" ON "stream_alerts" USING btree ("twitch_user_id");