FROM docker.io/oven/bun:1-alpine@sha256:07235578f79ef8c6f97d94aee7938e76f5cdba5f21ae5dbfdd3d3d38058437eb AS build

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

FROM docker.io/oven/bun:1-alpine@sha256:07235578f79ef8c6f97d94aee7938e76f5cdba5f21ae5dbfdd3d3d38058437eb

WORKDIR /app
COPY --from=build /app /app

LABEL org.opencontainers.image.source="https://github.com/daanvzijl/yet-another-discord-bot"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.description="Yet another Discord bot"

ENTRYPOINT ["bun", "run", "src/main.ts"]
