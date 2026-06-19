# Node.js 18 Alpine
FROM node:18-alpine

# 创建应用目录
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制应用代码
COPY src/ ./src/
COPY .env.example .env

# 创建 uploads 目录
RUN mkdir -p src/uploads && chmod 755 src/uploads

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "src/app.js"]
