#!/usr/bin/env bash
# Create the app secrets on the bot's machine. Prints only file names, never values.
# ~/.secrets/cc/<NAME>          one value per file, no newline (pass to connector tools as "$file:<path>")
# ~/.secrets/control-center.env the same values for push-data.sh (CC_URL is appended after the first deploy)
set -euo pipefail
umask 077
D="$HOME/.secrets/cc"; ENV="$HOME/.secrets/control-center.env"
mkdir -p "$D"
[ -e "$ENV" ] && { echo "secrets already exist: $ENV (not overwritten)"; exit 0; }
for n in SESSION_SECRET CONTROL_ACCESS_TOKEN ADMIN_KEY; do
  node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64url'))" > "$D/$n"
  printf '%s=%s\n' "$n" "$(cat "$D/$n")" >> "$ENV"
done
chmod 600 "$D"/* "$ENV"
echo "gen-secrets: wrote $D/{SESSION_SECRET,CONTROL_ACCESS_TOKEN,ADMIN_KEY} and $ENV"
