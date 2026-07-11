/**
 * NextAuth Middleware
 * 保护需要认证的路由
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                     req.nextUrl.pathname.startsWith('/register');

  // 未登录且访问受保护页面 -> 重定向到登录页
  if (!isLoggedIn && !isAuthPage && req.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 已登录且访问登录/注册页 -> 重定向到首页
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/chat', req.url));
  }

  return NextResponse.next();
});

// 配置需要保护的路由
export const config = {
  matcher: [
    '/chat/:path*',
    '/materials/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
