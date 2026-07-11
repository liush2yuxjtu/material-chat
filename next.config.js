/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 standalone 输出模式（用于 Docker 部署）
  output: 'standalone',
  
  // 实验性特性
  experimental: {
    // 启用 Server Actions
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // 图片配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.aliyuncs.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: 'Material Chat',
  },
};

module.exports = nextConfig;
