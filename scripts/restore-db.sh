#!/bin/bash
# 数据库恢复脚本
# 用于部署成功后从备份恢复数据

set -e

BACKUP_DIR="/opt/ele_admin/backups"
CONTAINER_NAME="ele_admin_mongodb"
DB_NAME="ele_admin"

echo "===== 数据库恢复 ====="

# 检查备份目录
if [ ! -d "$BACKUP_DIR" ]; then
    echo "备份目录不存在: $BACKUP_DIR"
    exit 1
fi

# 查找最新备份
LATEST_BACKUP=$(ls -td $BACKUP_DIR/*/ 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "没有找到备份文件"
    exit 1
fi

echo "使用备份: $LATEST_BACKUP"

# 检查 MongoDB 容器是否运行
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "MongoDB 容器未运行，请先启动服务"
    exit 1
fi

# 恢复数据
echo "开始恢复数据..."

# 使用 mongorestore 恢复
docker exec $CONTAINER_NAME mongorestore --db $DB_NAME --drop $LATEST_BACKUP/$DB_NAME

echo "===== 恢复完成 ====="
