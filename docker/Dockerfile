# ===== 阶段 1: 安装依赖 =====
FROM node:18-alpine AS deps

WORKDIR /app

# 配置 npm 国内镜像源
RUN npm config set registry https://registry.npmmirror.com

# 先复制 package.json（变化频率低，利于缓存）
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# ===== 阶段 2: 运行时镜像 =====
FROM node:18-alpine AS runner

WORKDIR /app

# 声明默认端口，与 HEALTHCHECK 保持一致
ENV PORT=3000

# 从 deps 阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制应用代码
COPY src/ ./src/
COPY .env.example .env

# 创建 uploads 目录
RUN mkdir -p src/uploads && chmod 755 src/uploads

# 暴露端口
EXPOSE 3000

# 健康检查（使用 PORT 变量，与运行时保持一致）
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# 启动命令
CMD ["node", "src/app.js"]
