# 多阶段构建 - 依赖安装阶段
FROM node:18-alpine AS deps

WORKDIR /app

# 只复制依赖文件，利用 Docker 缓存
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 最终运行阶段
FROM node:18-alpine

WORKDIR /app

# 安装 tini 和 curl（用于健康检查）
RUN apk add --no-cache tini curl

# 全局安装 PM2
RUN npm install -g pm2

# 从依赖阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制应用代码
COPY . .

# 创建必要目录并设置权限
RUN mkdir -p logs uploads && \
    chown -R node:node /app

# 切换到非 root 用户
USER node

# 暴露端口
EXPOSE 3000

# 设置生产环境
ENV NODE_ENV=production

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 使用 tini 作为初始化进程
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["pm2-runtime", "start", "pm2.config.js"]
