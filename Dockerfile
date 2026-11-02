FROM docker.io/oven/bun:1-alpine@sha256:4cf82f5686b196504fe119db3fcd9185b191f82ece82c40680e597228ec6070a AS build

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

FROM docker.io/oven/bun:1-alpine@sha256:4cf82f5686b196504fe119db3fcd9185b191f82ece82c40680e597228ec6070a

WORKDIR /app
COPY --from=build /app /app

LABEL org.opencontainers.image.source="https://github.com/daanvzijl/yet-another-discord-bot"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.description="Yet another Discord bot"

USER bun
ENTRYPOINT ["bun", "run", "src/main.ts"]
