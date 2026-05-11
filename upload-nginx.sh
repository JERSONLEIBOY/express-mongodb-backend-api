#!/bin/bash

# 上传并配置 Nginx 脚本
echo "=== 上传并配置 Nginx ==="

# 上传配置文件
echo "上传 Nginx 配置文件..."
scp setup-nginx-only.sh root@8.148.145.218:/root/

# 登录服务器执行配置
echo "登录服务器配置 Nginx..."
ssh -t root@8.148.145.218 << 'EOF'
    # 进入项目目录
    cd /root/express_mongoodb

    # 给脚本执行权限
    chmod +x setup-nginx-only.sh

    # 执行 Nginx 配置
    ./setup-nginx-only.sh
EOF

echo
echo "=== 完成 ==="
echo "请等待 1-2 分钟让 SSL 证书申请完成"
echo "然后访问: https://euiadminplus.cloud-ip.cc"