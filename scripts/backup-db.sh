#!/bin/bash

# MongoDB 数据库备份脚本
# 使用方法: ./backup-db.sh

set -e

# 配置
BACKUP_DIR="/opt/express-mongodb-backend-api/backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="mongodb_backup_${TIMESTAMP}"
CONTAINER_NAME="ele_admin_mongodb"
DB_NAME="ele_admin"

# 保留最近 N 个备份
KEEP_BACKUPS=7

# 创建备份目录
mkdir -p ${BACKUP_DIR}

echo "开始备份数据库: ${DB_NAME}"
echo "备份时间: $(date)"

# 执行备份
docker exec ${CONTAINER_NAME} mongodump \
  --db ${DB_NAME} \
  --out /backup/${BACKUP_NAME} \
  --gzip

if [ $? -eq 0 ]; then
  echo "✅ 备份成功: ${BACKUP_DIR}/${BACKUP_NAME}"

  # 压缩备份
  cd ${BACKUP_DIR}
  tar -czf ${BACKUP_NAME}.tar.gz ${BACKUP_NAME}
  rm -rf ${BACKUP_NAME}

  echo "✅ 备份已压缩: ${BACKUP_NAME}.tar.gz"

  # 清理旧备份
  echo "清理旧备份，保留最近 ${KEEP_BACKUPS} 个..."
  ls -t ${BACKUP_DIR}/mongodb_backup_*.tar.gz | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -f

  echo "当前备份列表:"
  ls -lh ${BACKUP_DIR}/mongodb_backup_*.tar.gz 2>/dev/null || echo "无备份文件"

else
  echo "❌ 备份失败"
  exit 1
fi
