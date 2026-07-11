# 素材管理与 AI 问答平台 - LAN 内网部署指南

## 目录

1. [部署前准备](#部署前准备)
2. [环境要求](#环境要求)
3. [快速部署步骤](#快速部署步骤)
4. [网络配置](#网络配置)
5. [验证部署](#验证部署)
6. [故障排查](#故障排查)

---

## 部署前准备

### 1. 获取必要的 API 密钥

在部署前，您需要准备以下 API 密钥：

- **Kimi API Key**：用于 LLM 对话功能
  - 获取地址：https://api.kimi.com/
  - 需要注册并创建 API 密钥

- **Vercel Sandbox API Key**：用于沙盒执行功能
  - 获取地址：https://vercel.com/dashboard
  - 需要 Vercel 账号并开启 Sandbox 功能

- **NextAuth Secret**：用于会话加密
  - 生成命令：`openssl rand -base64 32`

### 2. 服务器准备

确保部署服务器满足以下条件：

- 操作系统：Linux (Ubuntu 20.04+ / CentOS 7+ / Debian 10+)
- CPU：2 核心以上
- 内存：4GB 以上
- 磁盘：20GB 以上可用空间
- 已安装 Docker 和 Docker Compose

---

## 环境要求

### Docker 环境

```bash
# 安装 Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 网络端口

确保以下端口未被占用：

- `80`：Nginx HTTP 端口（对外访问）
- `3000`：Next.js 应用端口（内部）
- `5432`：PostgreSQL 端口（内部）

---

## 快速部署步骤

### 1. 克隆项目代码

```bash
git clone <your-repo-url> material-chat
cd material-chat
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填写必要的配置
nano .env
```

**必须配置的环境变量：**

```bash
# 数据库密码
DB_PASSWORD=your_secure_password

# Kimi API 密钥
KIMI_API_KEY=sk-xxx

# Vercel Sandbox API 密钥
VERCEL_SANDBOX_API_KEY=xxx

# NextAuth 密钥（生成命令：openssl rand -base64 32）
NEXTAUTH_SECRET=xxx
```

### 3. 启动服务

```bash
# 构建并启动所有容器
docker-compose up -d

# 查看启动日志
docker-compose logs -f
```

### 4. 初始化数据库

```bash
# 等待数据库启动完成（约 10-15 秒）
sleep 15

# 运行数据库迁移
docker-compose exec app npx prisma migrate deploy

# 生成 Prisma Client
docker-compose exec app npx prisma generate
```

### 5. 验证部署

访问 `http://<服务器IP>` 或 `http://localhost`（如果是本地部署）

---

## 网络配置

### LAN 内网访问设置

#### 1. 获取服务器 IP 地址

```bash
# 查看服务器内网 IP
ip addr show | grep inet
# 或
ifconfig | grep inet
```

#### 2. 配置防火墙规则

**Ubuntu/Debian (UFW)：**

```bash
# 开放 HTTP 端口
sudo ufw allow 80/tcp

# 查看规则
sudo ufw status
```

**CentOS/RHEL (firewalld)：**

```bash
# 开放 HTTP 端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload

# 查看规则
sudo firewall-cmd --list-all
```

#### 3. 配置 NEXTAUTH_URL

编辑 `.env` 文件，将 `NEXTAUTH_URL` 修改为实际的内网访问地址：

```bash
# 示例：如果服务器内网 IP 是 192.168.1.100
NEXTAUTH_URL=http://192.168.1.100
```

重启应用使配置生效：

```bash
docker-compose restart app
```

#### 4. 客户端访问

内网其他设备可通过以下地址访问：

```
http://192.168.1.100
```

---

## 验证部署

### E2E 测试链路

按以下顺序测试完整功能链路：

#### 1. 健康检查

```bash
# 检查所有服务状态
docker-compose ps

# 应该看到 3 个服务都是 Up 状态：
# - material-chat-db (postgres)
# - material-chat-app (app)
# - material-chat-nginx (nginx)
```

#### 2. 用户注册与登录

- 访问首页
- 点击"注册"按钮
- 填写用户名和密码
- 完成注册后自动登录

#### 3. AI 对话功能

- 在对话框输入："你好"
- 验证 LLM 能正常响应（KimiAdapter 工作正常）
- 验证流式响应效果

#### 4. SQL 查询功能

- 输入自然语言查询："查询用户表的前 10 条记录"
- 验证能生成并执行 SQL
- 验证结果展示（PostgresAdapter 工作正常）

#### 5. 文件上传功能

- 点击上传按钮
- 选择一个图片或文档文件
- 验证上传成功（LocalFileSystemAdapter 工作正常）
- 验证文件列表显示

#### 6. Bash 执行功能

- 输入命令："执行 echo 'Hello World'"
- 验证沙盒执行返回结果（VercelSandboxAdapter 工作正常）

---

## 故障排查

### 常见问题

#### 1. 容器启动失败

**现象：** `docker-compose up -d` 后某个容器状态为 Exit

**排查步骤：**

```bash
# 查看容器日志
docker-compose logs <service-name>

# 常见原因：
# - 数据库密码未配置
# - API 密钥缺失或无效
# - 端口被占用
```

#### 2. 数据库连接失败

**现象：** 应用日志显示 "Connection refused" 或 "ECONNREFUSED"

**解决方法：**

```bash
# 1. 检查数据库容器是否正常运行
docker-compose ps db

# 2. 检查数据库健康状态
docker-compose exec db pg_isready -U app

# 3. 重启数据库服务
docker-compose restart db

# 4. 检查环境变量配置
docker-compose exec app printenv | grep POSTGRES
```

#### 3. Kimi API 调用失败

**现象：** AI 对话功能无响应或报错

**解决方法：**

```bash
# 1. 验证 API 密钥是否正确
docker-compose exec app printenv | grep KIMI_API_KEY

# 2. 测试 API 连接
docker-compose exec app curl -H "anthropic-api-key: $KIMI_API_KEY" \
  https://api.kimi.com/coding/v1/messages

# 3. 查看应用日志
docker-compose logs app | grep -i kimi
```

#### 4. 文件上传失败

**现象：** 上传文件时报错 "Upload failed"

**解决方法：**

```bash
# 1. 检查存储目录权限
docker-compose exec app ls -la /app/storage

# 2. 检查磁盘空间
df -h

# 3. 检查 Nginx 上传大小限制
# 编辑 nginx.conf，确保 client_max_body_size 足够大
```

#### 5. 内网无法访问

**现象：** 局域网其他设备无法访问应用

**解决方法：**

```bash
# 1. 检查防火墙规则
sudo ufw status
# 或
sudo firewall-cmd --list-all

# 2. 检查服务是否监听正确端口
netstat -tlnp | grep 80

# 3. 测试从其他设备 ping 服务器
ping 192.168.1.100

# 4. 检查 NEXTAUTH_URL 配置
docker-compose exec app printenv | grep NEXTAUTH_URL
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f nginx

# 查看最近 100 行日志
docker-compose logs --tail=100 app
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart app

# 完全重建并重启
docker-compose down
docker-compose up -d --build
```

---

## 生产环境建议

### 1. 使用 HTTPS

生成自签名证书（测试用）：

```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/nginx.key -out ssl/nginx.crt
```

更新 `nginx.conf` 添加 HTTPS 配置。

### 2. 数据备份

```bash
# 备份数据库
docker-compose exec db pg_dump -U app material_chat > backup.sql

# 恢复数据库
cat backup.sql | docker-compose exec -T db psql -U app material_chat
```

### 3. 监控与日志

- 配置日志轮转：`logrotate`
- 监控容器资源：`docker stats`
- 配置告警通知

---

## 技术支持

如遇到其他问题，请查看：

- 项目 README.md
- 源码注释和文档
- 提交 Issue 到代码仓库
