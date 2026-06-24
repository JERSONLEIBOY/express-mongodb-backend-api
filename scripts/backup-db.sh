#!/bin/bash
# ================================================
# MongoDB 数据库备份脚本
# 用法:
#   ./scripts/backup-db.sh              # 立即备份
#   ./scripts/backup-db.sh /path/to/dir # 备份到指定目录
# ================================================

set -e

# 配置
MONGO_CONTAINER="ele_admin_mongodb"
MONGO_DB="ele_admin"
MONGO_USER="${MONGO_USERNAME:-admin}"
MONGO_PASS="${MONGO_PASSWORD}"
BACKUP_DIR="${1:-/opt/ele_admin/backups}"
RETENTION_DAYS=28  # 保留 4 周

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
BACKUP_FILE="${BACKUP_DIR}/backup-$(date +%Y%m%d-%H%M%S).gz"

echo "=========================================="
echo "  数据库备份 - $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 检查容器运行状态
if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
  echo "❌ MongoDB 容器 ${MONGO_CONTAINER} 未运行"
  exit 1
fi

# 执行备份
echo "⏺️  正在备份数据库 ${MONGO_DB}..."
if [ -n "$MONGO_PASS" ]; then
  docker exec "$MONGO_CONTAINER" mongodump \
    --db "$MONGO_DB" \
    --archive --gzip \
    -u "$MONGO_USER" -p "$MONGO_PASS" \
    --authenticationDatabase admin \
    > "$BACKUP_FILE"
else
  docker exec "$MONGO_CONTAINER" mongodump \
    --db "$MONGO_DB" \
    --archive --gzip \
    > "$BACKUP_FILE"
fi

# 验证备份文件
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "  备份完成: ${BACKUP_FILE} (${BACKUP_SIZE})"

# 清理旧备份（保留 RETENTION_DAYS 天）
echo ""
echo "🧹 清理 ${RETENTION_DAYS} 天前的备份..."
find "$BACKUP_DIR" -name "backup-*.gz" -type f -mtime +${RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name "pre-rollback-*.gz" -type f -mtime +${RETENTION_DAYS} -delete

# 显示保留的备份
echo ""
echo "当前保留的备份:"
ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' || echo "  (无备份文件)"

echo ""
echo "✅ 备份完成"
