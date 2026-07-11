# 演示指南

## 视觉资产清单

### 截图需求
- [ ] 登录页面
- [ ] 素材列表页
- [ ] 素材上传界面
- [ ] AI 对话界面
- [ ] 搜索结果页

### 视频需求
- [ ] 功能演示视频 (ui-demo)
- [ ] 架构原理动画 (manim 或类似工具)
- [ ] 完整演示视频 (最终剪辑版本)

## 制作工具建议

由于系统未包含指定的技能,建议使用以下替代方案:

### UI 演示录制
```bash
# 使用 Playwright 录制交互
npm run test:e2e -- --headed --trace on
```

### 视频制作
- **Remotion**: React-based 视频创建
- **Manim**: Python 数学动画库
- **FFmpeg**: 视频编辑和拼接

## 下一步行动

1. 启动开发服务器并手动截图
2. 使用 Playwright trace viewer 导出交互录像
3. 安装视频制作工具库
4. 创建 git tag `v0.1.0`
