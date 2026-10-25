#!/usr/bin/env -S just --justfile

local_db_url := "postgres://bot:bot@localhost:5432/bot"
# from the shell or .env, otherwise the local postgres started by `just db-up`
db_url := env("DATABASE_URL", `sed -n 's/^DATABASE_URL=//p' .env 2>/dev/null || true`)
export DATABASE_URL := if db_url == "" { local_db_url } else { db_url }

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

run: db-up
    bun run src/main.ts

# manage alerts, e.g. `just cli alert list`
cli *args: db-up
    bun run src/cli.ts {{ args }}

# generate a migration after changing src/db/schema.ts
db-generate name:
    bunx drizzle-kit generate --name {{ name }}

# start a local postgres, unless DATABASE_URL points elsewhere
db-up:
    #!/usr/bin/env bash
    set -euo pipefail
    [[ "$DATABASE_URL" == "{{ local_db_url }}" ]] || exit 0
    podman container exists yadb-postgres || podman run -d --rm --name yadb-postgres -e POSTGRES_USER=bot -e POSTGRES_PASSWORD=bot -e POSTGRES_DB=bot -p 5432:5432 docker.io/library/postgres:18-alpine >/dev/null
    until podman exec yadb-postgres pg_isready -U bot -d bot -q; do sleep 0.5; done

# stop the local postgres, its data is discarded
db-down:
    podman stop yadb-postgres

docker-build:
    podman build -t yadb .
