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

cd backend
npm ci
npm run build
pm2 restart intervu-backend --update-env || pm2 start dist/index.js --name intervu-backend
pm2 save
