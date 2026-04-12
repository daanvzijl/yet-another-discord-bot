# Yet another Discord bot

A Discord bot that sends a notification when a Twitch channel goes live.

## Setup

**Prerequisites**

- mise

Run `just install` to get going.

## Configuration

| Variable                | Required | Description                                                                 |
| ----------------------- | -------- | --------------------------------------------------------------------------- |
| `DISCORD_TOKEN`         | Yes      | Discord bot token                                                           |
| `DISCORD_LIVE_CHANNEL_ID` | Yes    | ID of the channel to send live notifications to                             |
| `DISCORD_LIVE_MESSAGE`  | No       | Message template. Supports `{username}`, `{title}`, `{game}`. Defaults to `🔴 **{username}** is live — **{title}** ({game})\nhttps://twitch.tv/{username}` |
| `TWITCH_CLIENT_ID`      | Yes      | Twitch application client ID                                                |
| `TWITCH_CLIENT_SECRET`  | Yes      | Twitch application client secret                                            |
| `TWITCH_WEBHOOK_SECRET` | Yes      | Secret used to verify Twitch webhook requests (10–100 characters)           |
| `TWITCH_CHANNEL_NAME`   | Yes      | Twitch channel name to monitor                                              |
| `PUBLIC_HOSTNAME`       | Yes      | Publicly reachable hostname for Twitch to send webhook events to            |

## Docker

```sh
docker run \
  -e DISCORD_TOKEN=your_token \
  -e DISCORD_LIVE_CHANNEL_ID=your_channel_id \
  -e TWITCH_CLIENT_ID=your_client_id \
  -e TWITCH_CLIENT_SECRET=your_client_secret \
  -e TWITCH_WEBHOOK_SECRET=your_webhook_secret \
  -e TWITCH_CHANNEL_NAME=your_channel \
  -e PUBLIC_HOSTNAME=your_hostname \
  ghcr.io/daanvzijl/yet-another-discord-bot:latest
```

Multi-platform images are published for `linux/amd64` and `linux/arm64`.

## Development

```sh
just test   # run tests
just lint   # run all linters
```

## Release

Releases are triggered by merging a PR with one of the following labels:

| Label           | Effect                               |
| --------------- | ------------------------------------ |
| `release:patch` | Bumps patch version (1.0.0 → 1.0.1)  |
| `release:minor` | Bumps minor version (1.0.0 → 1.1.0)  |
| `release:major` | Bumps major version (1.0.0 → 2.0.0)  |

If multiple labels are applied, `major` takes precedence over `minor` over `patch`.
