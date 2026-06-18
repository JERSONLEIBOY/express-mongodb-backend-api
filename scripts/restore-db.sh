#!/bin/bash

# MongoDB 数据库恢复脚本
# 使用方法: ./restore-db.sh <backup_file.tar.gz>

set -e

if [ -z "$1" ]; then
  echo "使用方法: ./restore-db.sh <backup_file.tar.gz>"
  echo ""
  echo "可用备份:"
  ls -lh /opt/express-mongodb-backend-api/backup/mongodb_backup_*.tar.gz 2>/dev/null || echo "无备份文件"
  exit 1
fi

BACKUP_FILE=$1
BACKUP_DIR="/opt/express-mongodb-backend-api/backup"
CONTAINER_NAME="ele_admin_mongodb"
DB_NAME="ele_admin"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ 备份文件不存在: ${BACKUP_FILE}"
  exit 1
fi

echo "警告: 此操作将覆盖当前数据库!"
read -p "确认恢复备份? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "已取消恢复操作"
  exit 0
fi

# 解压备份
echo "解压备份文件..."
BACKUP_NAME=$(basename ${BACKUP_FILE} .tar.gz)
cd ${BACKUP_DIR}
tar -xzf ${BACKUP_FILE}

# 恢复数据库
echo "开始恢复数据库: ${DB_NAME}"
docker exec ${CONTAINER_NAME} mongorestore \
  --db ${DB_NAME} \
  --drop \
  --gzip \
  /backup/${BACKUP_NAME}/${DB_NAME}

if [ $? -eq 0 ]; then
  echo "✅ 数据库恢复成功"
  rm -rf ${BACKUP_DIR}/${BACKUP_NAME}
else
  echo "❌ 数据库恢复失败"
  exit 1
fi
