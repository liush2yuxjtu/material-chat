/**
 * NextAuth.js v5 配置
 * 支持邮箱密码登录和 Google OAuth
 */

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // Session策略：使用JWT（适合无状态部署）
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30天
  },

  pages: {
    signIn: '/login',
    error: '/error',
  },

  providers: [
    // 邮箱密码登录
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('请输入邮箱和密码');
        }

        // 查找用户
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.password) {
          throw new Error('用户不存在或密码错误');
        }

        // 验证密码
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          throw new Error('用户不存在或密码错误');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    }),

    // Google OAuth登录
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // JWT回调：添加用户ID到token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Session回调：添加用户ID到session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
