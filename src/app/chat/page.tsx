/**
 * 聊天页面
 * 支持SSE流式接收AI响应
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamPayload {
  type: 'text' | 'done';
  content?: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setMessages((previous) => [
      ...previous,
      { role: 'user', content: userMessage },
    ]);

    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok || !response.body) {
        throw new Error('请求失败');
      }

      let assistantMessage = '';
      setMessages((previous) => [
        ...previous,
        { role: 'assistant', content: '' },
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamEnded = false;

      const consumeFrame = (frame: string): void => {
        const data = frame
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');

        if (!data) return;
        if (data === '[DONE]') {
          streamEnded = true;
          return;
        }

        let parsed: StreamPayload;
        try {
          parsed = JSON.parse(data) as StreamPayload;
        } catch (error) {
          console.error('无法解析 SSE 数据帧:', error, data);
          throw new Error('流式响应格式错误');
        }

        if (parsed.type !== 'text' || !parsed.content) return;

        assistantMessage += parsed.content;
        setMessages((previous) => {
          const next = [...previous];
          next[next.length - 1] = {
            role: 'assistant',
            content: assistantMessage,
          };
          return next;
        });
      };

      while (!streamEnded) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });

        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() ?? '';
        for (const frame of frames) {
          consumeFrame(frame);
          if (streamEnded) break;
        }

        if (done) break;
      }

      buffer += decoder.decode();
      if (!streamEnded && buffer.trim()) {
        consumeFrame(buffer);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      const failureMessage: Message = {
        role: 'assistant',
        content: '抱歉，发送消息失败，请重试。',
      };
      setMessages((previous) => {
        const last = previous.at(-1);
        if (last?.role === 'assistant' && last.content === '') {
          return [...previous.slice(0, -1), failureMessage];
        }
        return [...previous, failureMessage];
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">素材管理与AI问答</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/materials')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            素材管理
          </button>
          <span className="text-sm text-gray-600">{session?.user?.email}</span>
          <button
            onClick={() => signOut()}
            className="text-sm text-red-600 hover:text-red-800"
          >
            退出
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">开始对话吧！</p>
            <p className="text-sm mt-2">这是一个测试环境，使用Mock LLM适配器</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleSend();
            }}
            placeholder="输入消息..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => void handleSend()}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}
