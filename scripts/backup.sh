#!/bin/bash
set -e

# ============================================================
# MongoDB 数据库备份脚本
# 用法: ./scripts/backup.sh [保留天数]
# 默认保留 7 天
# ============================================================

BACKUP_DIR="/opt/ele_admin/backup"
CONTAINER_NAME="ele_admin_mongodb"
DB_NAME="ele_admin"
RETENTION_DAYS=${1:-7}
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.tar.gz"
TEMP_DIR="/tmp/mongodb_backup_${DATE}"

echo "=== MongoDB 备份开始 ==="
echo "数据库: ${DB_NAME}"
echo "备份文件: ${BACKUP_FILE}"

mkdir -p "${TEMP_DIR}"

# 执行备份（gzip 压缩）
docker exec "${CONTAINER_NAME}" mongodump \
    --db="${DB_NAME}" \
    --out=/tmp/mongodb_backup \
    --gzip 2>/dev/null

# 从容器复制出来
docker cp "${CONTAINER_NAME}:/tmp/mongodb_backup" "${TEMP_DIR}/dump"

# 打包压缩
tar -czf "${BACKUP_FILE}" -C "${TEMP_DIR}" .

# 清理临时文件
rm -rf "${TEMP_DIR}"
docker exec "${CONTAINER_NAME}" rm -rf /tmp/mongodb_backup

# 计算备份大小
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "备份完成: ${BACKUP_FILE} (${BACKUP_SIZE})"

# 清理过期备份
echo ""
echo "清理 ${RETENTION_DAYS} 天前的备份..."
DELETED=$(find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -print -delete | wc -l)
echo "已删除 ${DELETED} 个过期备份"

# 列出当前备份
echo ""
echo "当前备份列表:"
ls -lh "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | awk '{print $9, $5}' || echo "无备份文件"

echo ""
echo "=== 备份完成 ==="
