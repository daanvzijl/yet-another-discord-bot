# Changelog

## Unreleased

### Breaking

- Postgres is required. Set `DATABASE_URL`. Migrations run on start.
- Alerts are stored in the database and managed with the CLI.
- `TWITCH_CHANNEL_NAME`, `DISCORD_LIVE_CHANNEL_ID` and `DISCORD_LIVE_MESSAGE` are removed. On first start with an empty database, they are imported as the first alert.
- The container runs as the `bun` user.

### Added

- Multiple Discord servers per instance, each with its own alerts.
- CLI: `alert list`, `alert add <twitch-login> <discord-channel-id> [template]`, `alert remove <id>`.
- `docker-compose.yml` with the bot and Postgres.
- Live messages are persisted and keep updating after a restart.

### Changed

- On start, only EventSub subscriptions for `PUBLIC_HOSTNAME` are pruned.

### Known issues

- Alert changes require a restart.
- Go-live events during downtime are not announced.

### Migration

1. Upgrade while no stream is live.
2. Stop all old instances.
3. Invite the bot to every Discord server it posts in.
4. Copy `.env.example` to `.env` and fill it in. Keep the old `TWITCH_CHANNEL_NAME`, `DISCORD_LIVE_CHANNEL_ID` and `DISCORD_LIVE_MESSAGE` to import them.
5. Run `docker compose up -d`.
6. Add the remaining alerts and restart:
   ```sh
   docker compose exec bot bun run src/cli.ts alert add <twitch-login> <discord-channel-id> ["<template>"]
   docker compose restart bot
   ```
7. Remove the old variables from `.env`.

Rollback: run image `0.0.10` with the old `.env`.
