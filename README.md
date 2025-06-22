# Teams翻译助手

一个基于Electron的跨平台Teams实时翻译工具，支持剪贴板监听和多AI模型。

## ✨ 功能特性

- 🎯 **剪贴板监听翻译** - 复制即翻译，无缝集成Teams
- 🤖 **多AI模型支持** - OpenAI GPT系列 + DeepSeek模型
- 💰 **成本控制** - 实时显示翻译成本和Token使用量
- 📚 **术语词典** - 自定义专业术语，提高翻译准确性
- 🎨 **样式配置** - 自定义翻译结果字体样式
- 📋 **历史记录** - 翻译历史和使用统计
- 🌍 **跨平台** - Windows、macOS、Linux全平台支持

## 📦 下载安装

### 方式1：下载预编译版本 (推荐)

在 [Releases页面](../../releases) 下载对应平台的安装包：

- **Windows**: `Teams翻译助手-x.x.x-x64-setup.exe` (安装版) 或 `Teams翻译助手-x.x.x-x64-portable.exe` (便携版)  
- **macOS**: `Teams翻译助手-x.x.x-x64.dmg` (Intel Mac) 或 `Teams翻译助手-x.x.x-arm64.dmg` (Apple Silicon)
- **Linux**: `Teams翻译助手-x.x.x-x64.AppImage` (通用) 或 `Teams翻译助手-x.x.x-x64.deb` (Debian/Ubuntu)

### 方式2：从源码构建

```bash
# 克隆项目
git clone https://github.com/你的用户名/teams-translator.git
cd teams-translator

# 安装依赖
npm install

# 开发运行
npm start

# 构建当前平台版本
npm run build-cross

# 构建指定平台 (需要对应系统)
npm run build-win    # Windows
npm run build-mac    # macOS  
npm run build-linux  # Linux
```

## 🔧 配置说明

### API Key配置

1. **OpenAI API Key**: 在配置页面输入您的OpenAI API Key
2. **DeepSeek API Key**: 在配置页面输入您的DeepSeek API Key

### 支持的AI模型

#### OpenAI模型
- **GPT-4o**: 最新最强，质量最佳
- **GPT-4o Mini**: 性价比最高，推荐日常使用
- **GPT-4 Turbo**: 高质量翻译
- **GPT-3.5 Turbo**: 最便宜选项

#### DeepSeek模型  
- **DeepSeek V3-0324**: 性能强劲，价格亲民 (推荐)
- **DeepSeek R1-0528**: 推理能力强，逻辑思维佳

## 🚀 使用方法

### 剪贴板监听翻译 (推荐)
1. 启用"剪贴板监听翻译"
2. 在Teams中复制日语文本  
3. 自动翻译并可选择自动复制结果
4. 粘贴到Teams聊天框

### 手动翻译
1. 在文本输入框输入或粘贴文本
2. 点击"翻译文本"按钮
3. 查看翻译结果

### 批量翻译
1. 输入多行文本（每行一个句子）
2. 点击"批量翻译"按钮
3. 逐行显示翻译结果

## 🛠️ 开发构建

### 本地开发
```bash
npm start          # 启动开发模式
npm run dev        # 启动调试模式
```

### 跨平台构建
```bash
npm run build-cross              # 构建当前平台支持的版本
node build-cross-platform.js    # 显示构建状态
```

### GitHub Actions自动构建
项目配置了GitHub Actions，推送标签时自动构建所有平台版本：

```bash
# 创建并推送版本标签
git tag v2.1.0
git push origin v2.1.0
```

构建完成后，在 [Releases页面](../../releases) 下载各平台版本。

## 📋 系统要求

- **Windows**: Windows 10/11 (x64)
- **macOS**: macOS 10.15+ (Intel) 或 macOS 11.0+ (Apple Silicon)  
- **Linux**: Ubuntu 18.04+ / CentOS 8+ / Fedora 32+

## 🐛 问题反馈

如果遇到问题，请在 [Issues页面](../../issues) 提交反馈，包含：
- 操作系统版本
- 应用版本号  
- 错误截图或日志
- 复现步骤

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙋 常见问题

### Q: 为什么剪贴板监听不工作？
A: 请确保：
1. 已配置有效的API Key
2. 已勾选"剪贴板监听翻译"
3. 系统允许应用访问剪贴板

### Q: 翻译成本如何计算？
A: 应用会实时显示Token使用量和估算成本，基于各模型的官方定价。

### Q: 如何获得Mac版本？
A: 查看 [BUILD_MAC.md](BUILD_MAC.md) 了解详细的Mac构建方法。

---

⭐ 如果这个项目对您有帮助，请给个Star支持一下！ 