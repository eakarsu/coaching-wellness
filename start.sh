#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
run_dir="$(pwd)"
if [[ -n "${RUNTIME_PROJECT_SOURCE:-}" && -d "$RUNTIME_PROJECT_SOURCE" ]]; then run_dir="$RUNTIME_PROJECT_SOURCE"; fi
case "${1:-start}" in
  check) exec npm --prefix "$run_dir" run check ;;
  migrate) if [[ "${ALLOW_SCHEMA_MIGRATION:-0}" != "1" ]];then echo "Refusing migration: set ALLOW_SCHEMA_MIGRATION=1" >&2;exit 1;fi;exec npm --prefix "$run_dir" run migrate:deploy ;;
  start) exec npm --prefix "$run_dir" start -- --hostname "${HOST:-127.0.0.1}" --port "${PORT:-3000}" ;;
  *) echo "Usage: $0 [check|migrate|start]" >&2;exit 64 ;;
esac
