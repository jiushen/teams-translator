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