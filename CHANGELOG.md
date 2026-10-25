# Changelog

All notable changes to this project are documented here. Versions follow the release labels described in the [README](README.md#release).

## Unreleased

One bot instance can now serve multiple Discord servers. Alerts (which Twitch channel posts to which Discord channel) are stored in Postgres instead of environment variables, and are managed with a CLI.

### ⚠️ Breaking changes

- **Postgres is required.** Set `DATABASE_URL`. Migrations run automatically on start. The new [`docker-compose.yml`](docker-compose.yml) runs the bot together with Postgres.
- **`TWITCH_CHANNEL_NAME`, `DISCORD_LIVE_CHANNEL_ID` and `DISCORD_LIVE_MESSAGE` are no longer used.** If they are set when the bot starts with an empty database, they are imported once as the first alert. After that they are ignored and can be removed.
- **Changing alerts needs a restart.** The CLI writes to the database, but the running bot only reads alerts on start.
- **The container runs as the non-root `bun` user** instead of root.

### Added

- Alerts are scoped per Discord server. Each one has its own channel and message template.
- CLI to manage alerts: `alert list`, `alert add <twitch-login> <discord-channel-id> [template]` and `alert remove <id>`.
- Live messages are stored in the database, so they are still updated and marked offline after a restart mid-stream.

### Changed

- On start, the bot only removes EventSub subscriptions that point to its own `PUBLIC_HOSTNAME` and are no longer needed. Before, it deleted **every** subscription of the Twitch app, including other deployments' subscriptions.

### Known limitations

- A go-live that happens while the bot is down isn't announced afterwards.

### Migrating from v0.0.x

These steps merge separate single-channel instances into one. If you only run one instance, skip the steps marked *(multiple instances)*.

1. **Wait until nobody is live.** Messages posted by the old version aren't tracked, so they won't be marked offline. A stream that is already live during the upgrade won't be announced either.
2. **Back up every instance's `.env`.** You need them to roll back, and to know which Twitch channel posts to which Discord channel.
3. **Stop all old instances.** Old versions delete every EventSub subscription of the Twitch app on start. If an old instance that uses the same Twitch app restarts, it removes the new instance's subscriptions too.
4. *(multiple instances)* **Invite the bot to every Discord server it should post in.** A single instance uses one `DISCORD_TOKEN`, so servers that had their own bot application need to invite this one. Give it permission to view the alert channel, send messages and embed links.
5. **Create the new `.env`.** Copy [`.env.example`](.env.example) and fill it in. Pick a strong `POSTGRES_PASSWORD`. To import the existing setup automatically, keep one instance's `TWITCH_CHANNEL_NAME`, `DISCORD_LIVE_CHANNEL_ID` and (optionally) `DISCORD_LIVE_MESSAGE`.
6. **Start it** with `docker compose up -d`. If you kept the old variables, the logs show `Imported legacy config as alert #1`:
   ```sh
   docker compose logs bot | grep Imported
   ```
7. *(multiple instances)* **Add the alerts of the other instances**, then restart the bot to apply them:
   ```sh
   docker compose exec bot bun run src/cli.ts alert add <twitch-login> <discord-channel-id> ["<template>"]
   docker compose exec bot bun run src/cli.ts alert list
   docker compose restart bot
   ```
   Put quotes around templates. A `\n` in a template becomes a newline.
8. **Remove the legacy variables** from `.env`.
9. **Check your Cloudflare tunnel.** It should route `PUBLIC_HOSTNAME` to `bot:3000`. Postgres must never be exposed.

**Rolling back:** stop the compose stack, then start the previous image (`ghcr.io/daanvzijl/yet-another-discord-bot:0.0.10`) with the old `.env`. The old version deletes all subscriptions on start and recreates its own, so nothing needs cleaning up on Twitch.
