#!/usr/bin/env -S just --justfile

default:
    just --list

install:
    bun install
    hk install

lint:
    hk check --all

fix:
    hk fix --all

test:
    bun test

run:
    bun run src/main.ts

# manage alerts, e.g. `just cli alert list`
cli *args:
    bun run src/cli.ts {{ args }}

# generate a migration after changing src/db/schema.ts
db-generate name:
    bunx drizzle-kit generate --name {{ name }}

# start a local postgres for `just run`
db-up:
    podman run -d --rm --name yadb-postgres -e POSTGRES_USER=bot -e POSTGRES_PASSWORD=bot -e POSTGRES_DB=bot -p 5432:5432 docker.io/library/postgres:18-alpine

docker-build:
    podman build -t yadb .
