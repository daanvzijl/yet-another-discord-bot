FROM docker.io/oven/bun:1-alpine@sha256:629e17411f1f129dbec3af78d5af9c9f2a937435c80349437206c6b0b7422373 AS build

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

FROM docker.io/oven/bun:1-alpine@sha256:629e17411f1f129dbec3af78d5af9c9f2a937435c80349437206c6b0b7422373

WORKDIR /app
COPY --from=build /app /app

LABEL org.opencontainers.image.source="https://github.com/daanvzijl/yet-another-discord-bot"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.description="Yet another Discord bot"

USER bun
ENTRYPOINT ["bun", "run", "src/main.ts"]
