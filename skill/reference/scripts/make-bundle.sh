#!/usr/bin/env bash
# Pack the app for the Vercel connector's create_deployment (a $file: reference works for at most 4 files
# per call, so all sources are embedded in one unpack.mjs that runs before `next build`).
# Usage (inside the app folder): ./make-bundle.sh  -> writes deploy/package.json, deploy/package-lock.json, deploy/unpack.mjs
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p deploy
node - <<'JS'
const fs = require('fs'), cp = require('child_process');
const list = cp.execSync("find app components lib data.json next.config.mjs tsconfig.json next-env.d.ts .env.production -type f 2>/dev/null || true").toString().trim().split('\n').filter(Boolean);
const m = {}; for (const f of list) m[f] = fs.readFileSync(f).toString('base64');
fs.writeFileSync('deploy/unpack.mjs', `import fs from 'fs'; import path from 'path';\nconst F=${JSON.stringify(m)};\nfor (const [f,b] of Object.entries(F)) { fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f, Buffer.from(b,'base64')); }\nconsole.log('unpacked', Object.keys(F).length, 'files');\n`);
const p = JSON.parse(fs.readFileSync('package.json')); p.scripts.build = 'node unpack.mjs && next build';
fs.writeFileSync('deploy/package.json', JSON.stringify(p, null, 2));
fs.copyFileSync('package-lock.json', 'deploy/package-lock.json');
console.log('make-bundle:', list.length, 'files,', fs.statSync('deploy/unpack.mjs').size, 'bytes');
JS
