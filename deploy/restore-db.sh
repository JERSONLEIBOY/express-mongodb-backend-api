#!/bin/bash

# ============================================
# 数据库还原脚本
# 用法: bash deploy/restore-db.sh [备份目录路径]
# 默认备份目录: backup/extract/mongo-backup
# ============================================

set -e

BACKUP_DIR="${1:-backup/extract/mongo-backup}"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ 备份目录不存在: $BACKUP_DIR"
  echo "用法: bash deploy/restore-db.sh [备份目录路径]"
  exit 1
fi

echo "📦 开始还原数据库..."
echo "   备份目录: $BACKUP_DIR"

# 将备份复制到 MongoDB 容器中
docker cp "$BACKUP_DIR" ele_admin_mongodb:/tmp/backup

# 在容器中执行 mongorestore
docker compose exec -T mongodb mongorestore --db=ele_admin /tmp/backup/ele_admin --drop

# 清理容器内临时文件
docker compose exec -T mongodb rm -rf /tmp/backup

echo "✅ 数据库还原完成！"
echo ""

# 显示还原后的集合
echo "📊 当前集合:"
docker compose exec -T mongodb mongosh ele_admin --eval "db.getCollectionNames()" --quiet
