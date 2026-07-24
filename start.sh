#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set -a; source "$project_dir/.env"; set +a
mode="${1:-start}"
case "$mode" in
  check) exec npm --prefix "$project_dir" run check ;;
  migrate) ALLOW_SCHEMA_MIGRATION=1 exec npm --prefix "$project_dir" run migrate:deploy ;;
  start) ;;
  *) echo 'usage: ./start.sh check|migrate|start' >&2; exit 2 ;;
esac
: "${DATABASE_URL:?DATABASE_URL is required}"; : "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}"; : "${OPENROUTER_MODEL:?OPENROUTER_MODEL is required}"; : "${OPENROUTER_BASE_URL:?OPENROUTER_BASE_URL is required}"
api_port="${BACKEND_PORT:?BACKEND_PORT is required}"; ui_port="${FRONTEND_PORT:?FRONTEND_PORT is required}"
[[ "$api_port" != "$ui_port" ]] || { echo 'ports must differ' >&2; exit 1; };for port in "$api_port" "$ui_port";do ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1||{ echo "port $port is occupied" >&2;exit 1;};done
export AUTH_MODE=local BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin
export DATABASE_SSL=disable AUTH_PUBLIC_KEY_BASE64="$(node -e 'const{publicKey}=require("crypto").generateKeyPairSync("rsa",{modulusLength:2048});process.stdout.write(Buffer.from(publicKey.export({type:"spki",format:"pem"})).toString("base64"))')"
export OIDC_ISSUER=https://runtime-id.invalid OIDC_AUDIENCE=wellness-runtime OIDC_AUTHORIZE_URL=https://runtime-id.invalid/authorize OIDC_TOKEN_URL=https://runtime-id.invalid/token OIDC_CLIENT_ID=runtime-wellness OIDC_CLIENT_SECRET=runtime-client-secret-long OIDC_REDIRECT_URI=https://runtime-id.invalid/callback
export WEBHOOK_SIGNING_SECRET=runtime-webhook-secret-at-least-32-characters
export BILLING_BASE_URL=https://billing.runtime.invalid BILLING_BEARER_TOKEN=runtime-billing-token VIDEO_BASE_URL=https://video.runtime.invalid VIDEO_BEARER_TOKEN=runtime-video-token WEARABLE_BASE_URL=https://wearable.runtime.invalid WEARABLE_BEARER_TOKEN=runtime-wearable-token NOTIFICATION_BASE_URL=https://notification.runtime.invalid NOTIFICATION_BEARER_TOKEN=runtime-notification-token
export PROVISION_ADMIN_EMAIL="${ADMIN_EMAIL:?ADMIN_EMAIL is required}" PROVISION_ADMIN_PASSWORD="${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}" PROVISION_ADMIN_NAME="${PROVISION_ADMIN_NAME:-Runtime Administrator}"
if [[ "${MIGRATE_ON_START:-false}" == "true" ]];then ALLOW_SCHEMA_MIGRATION=1 npm --prefix "$project_dir" run migrate:deploy;fi
npm --prefix "$project_dir" run create-admin
cleanup(){ trap - INT TERM EXIT;[[ -z "${proxy_pid:-}" ]]||kill "$proxy_pid" 2>/dev/null||true;[[ -z "${api_pid:-}" ]]||kill "$api_pid" 2>/dev/null||true;[[ -z "${proxy_pid:-}" ]]||wait "$proxy_pid" 2>/dev/null||true;[[ -z "${api_pid:-}" ]]||wait "$api_pid" 2>/dev/null||true;};trap cleanup INT TERM EXIT
NODE_ENV=development npm --prefix "$project_dir" run dev -- --hostname 127.0.0.1 --port "$api_port" & api_pid=$!
for ((attempt=0;attempt<180;attempt++));do curl -sS -o /dev/null "http://127.0.0.1:$api_port/api/auth/me" 2>/dev/null&&break;ps -p "$api_pid" >/dev/null||{ wait "$api_pid";exit $?;};sleep 0.5;done
curl -sS -o /dev/null "http://127.0.0.1:$api_port/api/auth/me"
RUNTIME_PROXY_PORT="$ui_port" RUNTIME_PROXY_TARGET_PORT="$api_port" node "$project_dir/_runtime-proxy.mjs" & proxy_pid=$!
wait "$api_pid" "$proxy_pid"
