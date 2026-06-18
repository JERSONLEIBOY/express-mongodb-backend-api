#!/bin/bash
set -e

# ============================================================
# 回滚脚本
# 用法: ./scripts/rollback.sh [版本]
# 不带参数则回滚到上一个版本
# ============================================================

APP_DIR="/opt/ele_admin"
VERSIONS_FILE="${APP_DIR}/.versions"

if [ ! -f "${VERSIONS_FILE}" ]; then
    echo "[错误] 版本记录文件不存在: ${VERSIONS_FILE}"
    echo "无法执行回滚"
    exit 1
fi

# 获取当前版本
CURRENT_VERSION=$(head -n1 "${VERSIONS_FILE}" | awk '{print $2}')
PREVIOUS_VERSION=$(tail -n1 "${VERSIONS_FILE}" | awk '{print $2}')

if [ -z "$1" ]; then
    # 回滚到上一个版本
    TARGET_VERSION=${PREVIOUS_VERSION}
    if [ -z "${TARGET_VERSION}" ]; then
        echo "[错误] 没有可回滚的版本"
        exit 1
    fi
else
    # 回滚到指定版本
    TARGET_VERSION="$1"
fi

echo "=== 开始回滚 ==="
echo "当前版本: ${CURRENT_VERSION}"
echo "目标版本: ${TARGET_VERSION}"
echo ""

cd "${APP_DIR}"

# 停止当前服务
echo "停止当前服务..."
docker compose down

# 拉取目标版本镜像
echo "拉取镜像: ${TARGET_VERSION}..."
docker compose pull

# 更新版本记录
echo "${TARGET_VERSION} $(date +%Y-%m-%d_%H:%M:%S)" >> "${VERSIONS_FILE}"

# 启动服务
echo "启动服务..."
IMAGE_TAG=${TARGET_VERSION} docker compose up -d

echo ""
echo "=== 回滚完成 ==="
echo "查看日志: docker compose logs -f"
echo "健康检查: curl http://localhost:3000/health"
