# 🚀 Teams翻译助手 - 快速构建指南

## ✅ 构建环境已配置完成

你的项目已经完全配置好跨平台构建，可以直接使用以下命令：

## 📦 一键构建命令

### 构建所有平台（推荐）
```bash
npm run build
```

### 构建特定平台
```bash
# Windows 版本 （已测试成功 ✅）
npm run build-win-only

# macOS 版本
npm run build-mac-only  

# Linux 版本
npm run build-linux-only
```

## 🎯 构建产物

构建完成后，在 `dist/` 目录会生成：

### 📁 Windows
- `Teams翻译助手-2.1.0-x64-setup.exe` (73MB) - 安装包
- `Teams翻译助手-2.1.0-x64-portable.exe` (73MB) - 绿色便携版

### 📁 macOS  
- `Teams翻译助手-2.1.0-x64.dmg` - Intel Mac
- `Teams翻译助手-2.1.0-arm64.dmg` - Apple Silicon Mac
- 对应的 .zip 压缩包

### 📁 Linux
- `Teams翻译助手-2.1.0-x64.AppImage` - 通用格式
- `Teams翻译助手-2.1.0-x64.deb` - Debian/Ubuntu
- `Teams翻译助手-2.1.0-x64.tar.gz` - 通用压缩包

## ⚡ 快速开始

1. **确保依赖已安装**：
   ```bash
   npm install
   ```

2. **构建当前平台**（最快）：
   ```bash
   # Windows
   npm run build-win-only
   
   # macOS  
   npm run build-mac-only
   
   # Linux
   npm run build-linux-only
   ```

3. **构建所有平台**：
   ```bash
   npm run build
   ```

## 🔧 已配置的特性

✅ **自动化构建脚本** - `build.js`  
✅ **跨平台支持** - Windows/macOS/Linux  
✅ **多种格式** - 安装包/便携版/压缩包  
✅ **文件大小优化** - 最大压缩  
✅ **智能错误处理** - 失败时自动重试  
✅ **构建结果展示** - 文件大小和路径  

## 📋 构建限制

- **Windows 上**：可构建 Windows + Linux
- **macOS 上**：可构建所有平台  
- **Linux 上**：可构建 Windows + Linux

## 🚨 注意事项

1. **首次构建**会下载 Electron 二进制文件（~100MB），需要良好的网络连接
2. **图标配置**已移除，使用默认图标（可后续添加）
3. **配置文件**会自动包含在构建中，实现绿色软件

## 🎉 立即开始

直接运行以下命令开始构建：

```bash
# 构建 Windows 版本（已验证可用）
npm run build-win-only
```

构建完成后，可执行文件位于 `dist/` 目录中！

## 🚀 GitHub Actions 自动构建（推荐）

### 方法1：推送标签触发
```bash
# 创建并推送版本标签
git tag v2.1.0
git push origin v2.1.0

# 等待10-15分钟，在GitHub Releases页面下载
```

### 方法2：手动触发
1. 访问 https://github.com/jiushen/teams-translator/actions
2. 选择 "Build and Release (Modern)" 工作流程
3. 点击 "Run workflow" 
4. 输入版本号（如：v2.1.0）
5. 点击绿色的 "Run workflow" 按钮

## 🛠️ 本地构建

### 前置要求
- Node.js 18+
- npm 或 yarn

### 构建命令
```bash
# 安装依赖
npm install

# 构建当前平台
npm run build

# 构建特定平台
npm run build-win     # Windows
npm run build-mac     # macOS  
npm run build-linux   # Linux

# 构建所有平台（需要对应环境）
npm run build-all
```

### 构建产物位置
```
dist/
├── Teams翻译助手-2.1.0-x64-setup.exe      # Windows安装版
├── Teams翻译助手-2.1.0-x64-portable.exe   # Windows便携版
├── Teams翻译助手-2.1.0-x64.dmg            # macOS Intel版
├── Teams翻译助手-2.1.0-arm64.dmg          # macOS Apple Silicon版
├── Teams翻译助手-2.1.0-x64.AppImage       # Linux通用版
├── Teams翻译助手-2.1.0-x64.deb            # Linux DEB包
└── Teams翻译助手-2.1.0-x64.tar.gz         # Linux压缩包
```

## 📋 构建状态检查

### GitHub Actions状态
访问：https://github.com/jiushen/teams-translator/actions

### 构建时间估算
- Windows: ~5-8分钟
- macOS: ~8-12分钟
- Linux: ~5-8分钟
- 总计: ~15-20分钟

## 🐛 故障排除

### 构建失败
1. 检查GitHub Actions日志
2. 验证package.json配置
3. 确保所有依赖已正确安装

### macOS签名问题
```bash
# 禁用代码签名（开发环境）
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build-mac
```

### Linux依赖问题
```bash
# Ubuntu/Debian
sudo apt-get install -y libnss3-dev libatk-bridge2.0-dev libdrm2-dev libxcomposite-dev libxdamage-dev libxrandr-dev libgbm-dev libxss1-dev libasound2-dev

# CentOS/RHEL
sudo yum install -y nss atk at-spi2-atk libdrm libXcomposite libXdamage libXrandr mesa-libgbm libXScrnSaver alsa-lib
```

## 🎯 发布流程

1. **测试应用**：确保功能正常
2. **更新版本号**：修改package.json中的version
3. **提交代码**：`git add . && git commit -m "发布v2.1.0"`
4. **推送代码**：`git push`
5. **创建标签**：`git tag v2.1.0 && git push origin v2.1.0`
6. **等待构建**：GitHub Actions自动构建
7. **测试下载**：下载并测试各平台版本
8. **发布Release**：如需要，编辑Release说明

## 💡 优化建议

### 减少构建时间
- 使用npm缓存
- 优化依赖包大小
- 并行构建多平台

### 提高成功率
- 固定依赖版本
- 添加构建前检查
- 配置重试机制

---

🎉 **现在您可以轻松构建全平台版本了！** 