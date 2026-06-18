# 多阶段构建 - 依赖安装阶段
FROM node:18-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && \
    npm cache clean --force

# 最终运行阶段
FROM node:18-alpine

WORKDIR /app

# 安装 curl（用于健康检查）
RUN apk add --no-cache curl

# 从依赖阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制应用代码
COPY . .

# 创建必要目录并设置权限
RUN mkdir -p uploads logs && \
    chown -R node:node /app

# 切换到非 root 用户
USER node

# 暴露端口
EXPOSE 3000

# 设置生产环境
ENV NODE_ENV=production

# 使用 tini 作为初始化进程，docker stop 时优雅关闭
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/app.js"]
