#!/bin/bash
set -e

# ============================================================
# MongoDB 数据库恢复脚本
# 用法: ./scripts/restore.sh <备份文件路径>
# 示例: ./scripts/restore.sh /opt/ele_admin/backup/ele_admin_20260618_120000.tar.gz
# ============================================================

if [ -z "$1" ]; then
    echo "用法: $0 <备份文件路径>"
    echo ""
    echo "可用备份:"
    ls -lh /opt/ele_admin/backup/*.tar.gz 2>/dev/null | awk '{print $9, $5}' || echo "  无备份文件"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="ele_admin_mongodb"
DB_NAME="ele_admin"
TEMP_DIR="/tmp/mongodb_restore_$(date +%s)"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "[错误] 备份文件不存在: ${BACKUP_FILE}"
    exit 1
fi

echo "=== MongoDB 恢复开始 ==="
echo "备份文件: ${BACKUP_FILE}"

# 解压备份到临时目录
mkdir -p "${TEMP_DIR}"
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"

# 检查解压后的结构
if [ ! -d "${TEMP_DIR}/dump" ]; then
    echo "[错误] 备份文件结构无效，缺少 dump 目录"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# 复制到容器
docker cp "${TEMP_DIR}/dump" "${CONTAINER_NAME}:/tmp/restore_dump"

# 执行恢复（--drop 会覆盖现有数据）
echo "正在恢复数据库..."
docker exec "${CONTAINER_NAME}" mongorestore \
    --db="${DB_NAME}" \
    --drop \
    /tmp/restore_dump \
    --gzip 2>/dev/null

# 清理
rm -rf "${TEMP_DIR}"
docker exec "${CONTAINER_NAME}" rm -rf /tmp/restore_dump

echo ""
echo "=== 恢复完成 ==="
echo "建议重启应用: docker compose restart app"
