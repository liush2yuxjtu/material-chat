# 多阶段构建 Dockerfile - Next.js 15 应用

# ===== 阶段 1: 依赖安装 =====
FROM node:20-alpine AS deps
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# 安装依赖（包括 devDependencies，用于构建）
RUN npm ci

# ===== 阶段 2: 构建应用 =====
FROM node:20-alpine AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建 Next.js 应用
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ===== 阶段 3: 生产运行 =====
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制 Prisma schema 和 node_modules（包含 Prisma Client）
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 创建上传目录（本地开发模式）
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 启动应用
CMD ["node", "server.js"]
