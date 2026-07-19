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

# t3.micro has only 1 GB RAM — npm ci with native deps gets OOM-killed
# without swap. Create a 2 GB swap file if one doesn't already exist.
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
fi

# Free up disk space before npm ci — the default 8 GB root volume
# fills up quickly with onnxruntime GPU binaries and old node_modules.
rm -rf node_modules backend/node_modules frontend/node_modules
npm cache clean --force 2>/dev/null || true

cd backend
npm ci
npm run build
pm2 restart intervu-backend --update-env || pm2 start dist/index.js --name intervu-backend
pm2 save
