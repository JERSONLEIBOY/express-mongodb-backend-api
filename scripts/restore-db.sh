#!/bin/bash
# ================================================
# MongoDB 数据库恢复脚本
# 用法:
#   ./scripts/restore-db.sh <backup-file>
# 示例:
#   ./scripts/restore-db.sh /opt/ele_admin/backups/backup-20260624-020000.gz
# ================================================

set -e

MONGO_CONTAINER="ele_admin_mongodb"
MONGO_DB="ele_admin"
MONGO_USER="${MONGO_USERNAME:-admin}"
MONGO_PASS="${MONGO_PASSWORD}"

echo "=========================================="
echo "  数据库恢复"
echo "=========================================="

# 检查参数
if [ -z "$1" ]; then
  echo "❌ 用法: $0 <backup-file>"
  echo ""
  echo "可用备份:"
  ls -lh /opt/ele_admin/backups/*.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' || echo "  (无备份文件)"
  exit 1
fi

BACKUP_FILE="$1"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ 备份文件不存在: ${BACKUP_FILE}"
  exit 1
fi

# 检查容器运行状态
if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
  echo "❌ MongoDB 容器 ${MONGO_CONTAINER} 未运行"
  exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "备份文件: ${BACKUP_FILE} (${BACKUP_SIZE})"
echo "目标数据库: ${MONGO_DB}"
echo ""

# 确认恢复
read -p "⚠️  恢复将覆盖当前数据库 ${MONGO_DB} 的所有数据，是否继续? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "已取消"
  exit 0
fi

echo ""
echo "🔄 正在恢复数据库..."

# 执行恢复
if [ -n "$MONGO_PASS" ]; then
  gunzip -c "$BACKUP_FILE" | docker exec -i "$MONGO_CONTAINER" mongorestore \
    --archive \
    --nsInclude="${MONGO_DB}.*" \
    --drop \
    -u "$MONGO_USER" -p "$MONGO_PASS" \
    --authenticationDatabase admin
else
  gunzip -c "$BACKUP_FILE" | docker exec -i "$MONGO_CONTAINER" mongorestore \
    --archive \
    --nsInclude="${MONGO_DB}.*" \
    --drop
fi

echo ""
echo "✅ 数据库恢复完成"
