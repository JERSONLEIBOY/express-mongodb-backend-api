# 域名配置指南
域名: euiadminplus.cloud-ip.cc
服务器 IP: 8.148.145.218

## 配置步骤

### 1. 在 Cloudns 添加 DNS 记录

登录 Cloudns 控制台，添加以下记录：

#### 记录列表：
1. **A 记录** (根域名 @)
   - 类型: A
   - 主机: @
   - 值: 8.148.145.218
   - TTL: 3600 (1小时)
   - 优先级: 留空

2. **A 记录** (www 子域 - 可选)
   - 类型: A
   - 主机: www
   - 值: 8.148.145.218
   - TTL: 3600
   - 优先级: 留空

### 2. 验证域名解析

添加记录后，等待 DNS 生效（通常需要几分钟到几小时）：

```bash
# 测试域名解析
nslookup euiadminplus.cloud-ip.cc
nslookup www.euiadminplus.cloud-ip.cc
```

### 3. 服务器端配置 Nginx

在服务器上安装并配置 Nginx：

```bash
# 安装 Nginx
sudo apt update
sudo apt install nginx -y

# 创建配置文件
sudo nano /etc/nginx/sites-available/api
```

配置文件内容：
```nginx
server {
    listen 80;
    server_name euiadminplus.cloud-ip.cc www.euiadminplus.cloud-ip.cc;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 配置 HTTPS (推荐)

使用 Certbot 获取免费 SSL 证书：
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d euiadminplus.cloud-ip.cc -d www.euiadminplus.cloud-ip.cc
```

### 5. 测试访问

配置完成后，访问：
- http://euiadminplus.cloud-ip.cc
- https://euiadminplus.cloud-ip.cc (启用 SSL 后)

## 注意事项

1. DNS 生效时间：通常 1-24 小时，通常 5-10 分钟
2. 如果无法访问，检查：
   - DNS 记录是否正确
   - 服务器防火墙是否开放 80/443 端口
   - Nginx 配置是否正确
3. 域名可能被某些服务商屏蔽（如 cloud-ip.cc 后缀）