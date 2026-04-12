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

docker-build:
    podman build -t yadb .
