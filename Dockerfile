FROM docker.io/oven/bun:1-alpine@sha256:26d8996560ca94eab9ce48afc0c7443825553c9a851f40ae574d47d20906826d AS build

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

FROM docker.io/oven/bun:1-alpine@sha256:26d8996560ca94eab9ce48afc0c7443825553c9a851f40ae574d47d20906826d

WORKDIR /app
COPY --from=build /app /app

LABEL org.opencontainers.image.source="https://github.com/daanvzijl/yet-another-discord-bot"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.description="Yet another Discord bot"

ENTRYPOINT ["bun", "run", "src/main.ts"]
