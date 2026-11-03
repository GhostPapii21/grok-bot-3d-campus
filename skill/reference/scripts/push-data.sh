#!/usr/bin/env bash
# Upload fresh DATA to the live app (no redeploy). Usage: ./push-data.sh path/to/data.json
# Reads ADMIN_KEY and CC_URL from a private env file on the bot's machine. Never prints them.
set -euo pipefail
ENV_FILE="${CC_ENV_FILE:-$HOME/.secrets/control-center.env}"
source "$ENV_FILE"
SRC="${1:?usage: push-data.sh data.json}"
python3 -c "import json,sys; d=json.load(open(sys.argv[1])); assert isinstance(d.get('TEAMS'),list) and isinstance(d['USAGE']['weeklyPct'],(int,float)) and isinstance(d['UPDATED'],str)" "$SRC"
code=$(curl -sS -o /tmp/cc-push.out -w '%{http_code}' -X POST "$CC_URL/api/admin/data" \
  -H "Authorization: Bearer $ADMIN_KEY" -H 'Content-Type: application/json' --data-binary "@$SRC")
echo "push-data: HTTP $code $(cat /tmp/cc-push.out)"
[ "$code" = 200 ]
