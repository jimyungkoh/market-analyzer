#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

cleanup() {
  docker-compose -f docker-compose.dev.yml down
}
trap cleanup EXIT INT TERM

docker-compose -f docker-compose.dev.yml up -d
pnpm dev
