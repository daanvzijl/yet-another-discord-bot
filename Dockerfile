FROM docker.io/oven/bun:1-alpine@sha256:4de475389889577f346c636f956b42a5c31501b654664e9ae5726f94d7bb5349 AS build

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

FROM docker.io/oven/bun:1-alpine@sha256:4de475389889577f346c636f956b42a5c31501b654664e9ae5726f94d7bb5349

WORKDIR /app
COPY --from=build /app /app

LABEL org.opencontainers.image.source="https://github.com/daanvzijl/yet-another-discord-bot"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.description="Yet another Discord bot"

ENTRYPOINT ["bun", "run", "src/main.ts"]
