# Yet another Discord bot

A Discord bot that sends a notification when a Twitch channel goes live. One instance can serve multiple Discord servers, each with their own alerts.

## Setup

**Prerequisites**

- mise

Run `just install` to get going.

## Configuration

Secrets and infrastructure are configured with environment variables. Alerts (which Twitch channel posts to which Discord channel) live in the database, and are managed with the [CLI](#managing-alerts).

| Variable                   | Required | Description                                                                  |
| -------------------------- | -------- | ---------------------------------------------------------------------------- |
| `DATABASE_URL`             | Yes      | Postgres connection string. Migrations run automatically on start.           |
| `DISCORD_TOKEN`            | Yes      | Discord bot token                                                            |
| `DISCORD_POLL_INTERVAL_MS` | No       | Interval in ms at which live embeds get updated. Defaults to `300000`.       |
| `TWITCH_CLIENT_ID`         | Yes      | Twitch application client ID                                                 |
| `TWITCH_CLIENT_SECRET`     | Yes      | Twitch application client secret                                             |
| `TWITCH_WEBHOOK_SECRET`    | Yes      | Secret used to verify Twitch webhook requests (10–100 characters)            |
| `PUBLIC_HOSTNAME`          | Yes      | Publicly reachable hostname for Twitch to send webhook events to (port 3000) |

### Upgrading from the single channel setup

`TWITCH_CHANNEL_NAME`, `DISCORD_LIVE_CHANNEL_ID` and `DISCORD_LIVE_MESSAGE` are no longer needed. If they are set when the bot starts with an empty database, they are imported as the first alert, after which they can be removed.

## Managing alerts

```sh
just cli alert list
just cli alert add <twitch-login> <discord-channel-id> ["{username} is live: {title} ({game})"]
just cli alert remove <id>
```

In Docker, run `docker compose exec bot bun run src/cli.ts alert ...` instead. Restart the bot afterwards to apply changes.

Message templates support `{username}`, `{title}` and `{game}`. Without one, alerts use `🔴 **{username}** is live — **{title}** ({game})\nhttps://twitch.tv/{username}`.

## Docker

The [`docker-compose.yml`](docker-compose.yml) runs the bot with Postgres, and optionally a Cloudflare tunnel (set `COMPOSE_PROFILES=tunnel` and `TUNNEL_TOKEN`). Copy `.env.example` to `.env`, fill it in, and run:

```sh
docker compose up -d
```

Multi-platform images are published for `linux/amd64` and `linux/arm64`.

## Development

```sh
just db-up                 # start a local postgres, then set DATABASE_URL=postgres://bot:bot@localhost:5432/bot
just run                   # run the bot
just test                  # run tests (uses an in-memory postgres, no database needed)
just lint                  # run all linters
just db-generate <name>    # generate a migration after changing src/db/schema.ts
```

## Release

Releases are triggered by merging a PR with one of the following labels:

| Label           | Effect                               |
| --------------- | ------------------------------------ |
| `release:patch` | Bumps patch version (1.0.0 → 1.0.1)  |
| `release:minor` | Bumps minor version (1.0.0 → 1.1.0)  |
| `release:major` | Bumps major version (1.0.0 → 2.0.0)  |

If multiple labels are applied, `major` takes precedence over `minor` over `patch`.
