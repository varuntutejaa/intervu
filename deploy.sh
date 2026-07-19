#!/bin/bash
set -e

cd ~/intervu

# Force the local checkout to exactly match origin/main.
# A deployment target should never carry its own local commits — this
# discards any divergent history (manual fixes, click-ops, etc.) and
# ensures the running code is always a byte-for-byte copy of what's
# on GitHub.
git fetch origin main
git reset --hard origin/main

cd backend
npm ci
npm run build
pm2 restart intervu-backend --update-env || pm2 start dist/index.js --name intervu-backend
pm2 save