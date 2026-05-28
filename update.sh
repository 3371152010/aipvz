#!/bin/bash
set -e
echo "===== 更新 PvZ ====="

cd "$(dirname "$0")"

# 拉取最新代码
echo "[1/5] 拉取代码..."
git pull

# 更新后端
echo "[2/5] 安装后端依赖..."
cd server
npm install --production

echo "[3/5] 编译后端..."
npx prisma generate
npm run build

echo "[4/5] 重启后端..."
pm2 restart pvz-server 2>/dev/null || pm2 start dist/src/main.js --name pvz-server

# 更新前端
echo "[5/5] 构建前端..."
cd ../client
npm install
npm run build

echo "===== 更新完成! ====="
