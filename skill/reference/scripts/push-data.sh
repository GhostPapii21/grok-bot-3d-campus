#!/usr/bin/env bash
# Upload fresh DATA to the live app (no redeploy). Usage: ./push-data.sh path/to/data.json
# Reads ADMIN_KEY and CC_URL from a private env file on the bot's machine. Never prints them.
set -euo pipefail
ENV_FILE="${CC_ENV_FILE:-$HOME/.secrets/control-center.env}"
source "$ENV_FILE"
SRC="${1:?usage: push-data.sh data.json}"
python3 -c "import json,sys; d=json.load(open(sys.argv[1])); assert isinstance(d.get('TEAMS'),list) and isinstance(d['USAGE']['weeklyPct'],(int,float)) and isinstance(d['UPDATED'],str)" "$SRC"
# Optional VERCEL_BYPASS (SKILL section 10.1): only when the user turned on Vercel Authentication.
BYPASS=(); [ -n "${VERCEL_BYPASS:-}" ] && BYPASS=(-H "x-vercel-protection-bypass: $VERCEL_BYPASS")
OUT=$(mktemp); trap 'rm -f "$OUT"' EXIT
code=$(curl -sS -o "$OUT" -w '%{http_code}' -X POST "$CC_URL/api/admin/data" ${BYPASS[@]+"${BYPASS[@]}"} \
  -H "Authorization: Bearer $ADMIN_KEY" -H 'Content-Type: application/json' --data-binary "@$SRC")
echo "push-data: HTTP $code $(cat "$OUT")"
[ "$code" = 200 ]
