/**
 * 素材管理页面
 * 支持上传、列表展示、预览
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type MaterialType = 'image' | 'video' | 'document' | 'other';

interface Material {
  id: string;
  name: string;
  type: MaterialType;
  url: string;
  size: number;
  mimeType: string;
  tags: string[];
  createdAt: string;
}

const materialTypes: readonly MaterialType[] = [
  'image',
  'video',
  'document',
  'other',
];

function isMaterialType(value: string): value is MaterialType {
  return materialTypes.includes(value as MaterialType);
}

export default function MaterialsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 状态管理
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 文件上传状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<MaterialType>('image');
  const [uploadTags, setUploadTags] = useState<string>('');

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType) params.append('type', selectedType);
      if (selectedTags) params.append('tags', selectedTags);

      const response = await fetch(`/api/v1/materials?${params}`);
      if (!response.ok) throw new Error('加载失败');

      const data: { materials?: Material[] } = await response.json();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('加载素材失败:', error);
      alert('加载素材失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [selectedTags, selectedType]);

  // 未登录重定向
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 加载素材列表
  useEffect(() => {
    if (status === 'authenticated') {
      void loadMaterials();
    }
  }, [loadMaterials, status]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件大小（100MB）
    if (file.size > 100 * 1024 * 1024) {
      alert('文件大小不能超过 100MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('请选择文件');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', uploadType);
      if (uploadTags.trim()) {
        formData.append('tags', uploadTags.trim());
      }

      const response = await fetch('/api/v1/materials', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error: { error?: string } = await response.json();
        throw new Error(error.error || '上传失败');
      }

      alert('上传成功！');
      setSelectedFile(null);
      setUploadTags('');
      await loadMaterials();
    } catch (error) {
      console.error('上传失败:', error);
      alert(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">素材管理</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/chat')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            返回聊天
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

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：上传区域 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">上传素材</h2>

              {/* 文件选择 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择文件
                </label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    已选择: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              {/* 素材类型 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  素材类型
                </label>
                <select
                  value={uploadType}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (isMaterialType(value)) {
                      setUploadType(value);
                    }
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="image">图片</option>
                  <option value="video">视频</option>
                  <option value="document">文档</option>
                  <option value="other">其他</option>
                </select>
              </div>

              {/* 标签 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签（逗号分隔）
                </label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(event) => setUploadTags(event.target.value)}
                  placeholder="例如: 产品, 宣传"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* 上传按钮 */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? '上传中...' : '上传'}
              </button>

              <p className="mt-4 text-xs text-gray-500">
                支持的格式：图片（JPEG, PNG, GIF, WebP）、视频（MP4, WebM）、文档（PDF, Word, Excel）
                <br />
                最大文件大小：100MB
              </p>
            </div>
          </div>

          {/* 右侧：素材列表 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* 筛选栏 */}
              <div className="p-4 border-b flex gap-4">
                <select
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">全部类型</option>
                  <option value="image">图片</option>
                  <option value="video">视频</option>
                  <option value="document">文档</option>
                  <option value="other">其他</option>
                </select>

                <input
                  type="text"
                  value={selectedTags}
                  onChange={(event) => setSelectedTags(event.target.value)}
                  placeholder="按标签筛选"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* 素材列表 */}
              <div className="p-4">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">加载中...</div>
                ) : materials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暂无素材，请上传
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {materials.map((material) => (
                      <div
                        key={material.id}
                        className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setPreviewUrl(material.url)}
                      >
                        {/* 预览缩略图 */}
                        <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
                          {material.type === 'image' ? (
                            <img
                              src={material.url}
                              alt={material.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400 text-4xl">
                              {material.type === 'video' ? '🎥' : '📄'}
                            </span>
                          )}
                        </div>

                        {/* 素材信息 */}
                        <h3 className="text-sm font-medium truncate" title={material.name}>
                          {material.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(material.size)} · {material.type}
                        </p>
                        {material.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {material.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 预览弹窗 */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={previewUrl}
              alt="预览"
              className="max-w-full max-h-screen rounded"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
