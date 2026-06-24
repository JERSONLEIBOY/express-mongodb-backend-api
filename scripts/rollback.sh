#!/bin/bash
# ================================================
# 快速回滚脚本 - 切换 Docker 镜像版本并重启服务
# 用法:
#   ./scripts/rollback.sh            # 交互式选择版本
#   ./scripts/rollback.sh commit-abc1234  # 直接指定版本
# ================================================

set -e

IMAGE_NAME="ele_admin_backend"
COMPOSE_FILE="docker-compose.yml"

echo "=========================================="
echo "  回滚工具"
echo "=========================================="

# 获取所有可用版本（按时间倒序）
AVAILABLE_TAGS=$(docker images ${IMAGE_NAME} --format '{{.Tag}}' | grep '^commit-' | sort -r)

if [ -z "$AVAILABLE_TAGS" ]; then
  echo "❌ 未找到任何 ${IMAGE_NAME}:commit-* 版本的镜像"
  echo "   可用的镜像标签:"
  docker images ${IMAGE_NAME} --format '  - {{.Tag}}'
  exit 1
fi

# 获取当前运行版本
CURRENT_TAG=$(docker inspect --format '{{.Config.Image}}' ele_admin_backend 2>/dev/null | cut -d: -f2 || echo "unknown")

# 如果指定了版本参数
if [ -n "$1" ]; then
  TARGET_TAG="$1"
  # 验证版本是否存在
  if ! docker images ${IMAGE_NAME}:${TARGET_TAG} --format '{{.Tag}}' | grep -q "${TARGET_TAG}"; then
    echo "❌ 版本 ${TARGET_TAG} 不存在"
    echo "   可用版本:"
    echo "$AVAILABLE_TAGS"
    exit 1
  fi
else
  # 交互式选择
  echo ""
  echo "当前版本: ${CURRENT_TAG}"
  echo ""
  echo "可用版本:"
  IFS=$'\n'
  i=1
  TAGS_ARRAY=()
  for tag in $AVAILABLE_TAGS; do
    TAGS_ARRAY+=("$tag")
    echo "  [$i] ${tag}"
    i=$((i + 1))
  done

  echo ""
  read -p "请选择要回滚到的版本 [1-$((i-1))]: " selection

  if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -ge "$i" ]; then
    echo "❌ 无效选择"
    exit 1
  fi

  TARGET_TAG="${TAGS_ARRAY[$((selection-1))]}"
fi

if [ "$TARGET_TAG" = "$CURRENT_TAG" ]; then
  echo "⚠️  当前版本已是 ${TARGET_TAG}，无需回滚"
  exit 0
fi

echo ""
echo "当前版本: ${CURRENT_TAG}"
echo "目标版本: ${TARGET_TAG}"
echo ""

# 回滚前自动备份数据库
echo "⏺️  正在备份数据库..."
BACKUP_FILE="/opt/ele_admin/backups/pre-rollback-$(date +%Y%m%d-%H%M%S).gz"
docker exec ele_admin_mongodb mongodump --archive --gzip \
  -u "${MONGO_USERNAME:-admin}" -p "${MONGO_PASSWORD}" --authenticationDatabase admin \
  2>/dev/null > "$BACKUP_FILE" || echo "  ⚠️  数据库备份失败，继续回滚..."
echo "  备份已保存: ${BACKUP_FILE}"

# 切换版本
echo ""
echo "🔄 正在切换到 ${TARGET_TAG}..."
export IMAGE_TAG="${TARGET_TAG}"
docker-compose -f ${COMPOSE_FILE} up -d app

# 健康检查
echo ""
echo "⏳ 等待服务启动..."
for i in $(seq 1 15); do
  if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 回滚成功，当前版本: ${TARGET_TAG}"
    exit 0
  fi
  echo "  等待中... ($i/15)"
  sleep 2
done

# 健康检查失败，回退到旧版本
echo "❌ 回滚后健康检查未通过，正在回退..."
export IMAGE_TAG="${CURRENT_TAG}"
docker-compose -f ${COMPOSE_FILE} up -d app
echo "⚠️  已回退到 ${CURRENT_TAG}，请检查日志: docker-compose logs app"
exit 1
