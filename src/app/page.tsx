/**
 * 首页 - 应用入口
 */

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* 标题 */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            素材管理与AI问答平台
          </h1>

          {/* 副标题 */}
          <p className="text-lg text-gray-600 mb-8">
            智能管理您的素材，与AI助手实时对话
          </p>

          {/* 功能介绍 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">💬</div>
              <div className="font-semibold mb-1">AI对话</div>
              <div className="text-gray-600">实时流式响应</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">📁</div>
              <div className="font-semibold mb-1">素材管理</div>
              <div className="text-gray-600">智能分类存储</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">🔍</div>
              <div className="font-semibold mb-1">SQL查询</div>
              <div className="text-gray-600">自然语言查询</div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              立即登录
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              注册账号
            </Link>
          </div>

          {/* 底部提示 */}
          <div className="mt-8 text-sm text-gray-500">
            <p>使用Mock LLM适配器进行演示</p>
          </div>
        </div>
      </div>
    </div>
  );
}
