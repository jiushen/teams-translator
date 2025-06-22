# Teams翻译助手 - 构建说明

## 🚀 快速开始

### 环境要求
- Node.js 16+ 
- npm 或 yarn
- Git

### 安装依赖
```bash
npm install
```

## 🔨 构建命令

### 一键构建所有平台
```bash
npm run build
# 或
node build.js
```

### 构建特定平台
```bash
# Windows 版本
npm run build-win-only
node build.js win

# macOS 版本  
npm run build-mac-only
node build.js mac

# Linux 版本
npm run build-linux-only
node build.js linux
```

### 原生 electron-builder 命令
```bash
# 构建当前平台
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux

# 构建所有平台（需要对应环境）
npm run build-all
```

## 📦 构建产物

构建完成后，所有文件将保存在 `dist/` 目录：

### Windows
- `Teams翻译助手-2.1.0-x64-setup.exe` - 安装包
- `Teams翻译助手-2.1.0-x64-portable.exe` - 便携版

### macOS
- `Teams翻译助手-2.1.0-x64.dmg` - Intel Mac 磁盘映像
- `Teams翻译助手-2.1.0-arm64.dmg` - Apple Silicon Mac 磁盘映像
- `Teams翻译助手-2.1.0-x64.zip` - Intel Mac 压缩包
- `Teams翻译助手-2.1.0-arm64.zip` - Apple Silicon Mac 压缩包

### Linux
- `Teams翻译助手-2.1.0-x64.AppImage` - AppImage 格式
- `Teams翻译助手-2.1.0-x64.deb` - Debian/Ubuntu 包
- `Teams翻译助手-2.1.0-x64.tar.gz` - 通用压缩包

## 🔧 跨平台构建限制

由于代码签名和平台限制：

- **在 Windows 上**: 可以构建 Windows 和 Linux 版本，无法构建 macOS
- **在 macOS 上**: 可以构建所有平台版本
- **在 Linux 上**: 可以构建 Windows 和 Linux 版本，无法构建 macOS

## 📋 构建选项

### 自定义构建配置

编辑 `package.json` 中的 `build` 部分：

```json
{
  "build": {
    "appId": "com.teamstranslator.app",
    "productName": "Teams翻译助手",
    "compression": "maximum",
    // ... 其他配置
  }
}
```

### 图标文件

应用图标位于 `build/icon.svg`，electron-builder 会自动转换为各平台所需格式：
- Windows: .ico
- macOS: .icns  
- Linux: .png

## 🛠️ 开发构建

### 开发模式运行
```bash
npm start
# 或带调试信息
npm run dev
```

### 打包但不分发
```bash
npm run pack
```

### 清理构建文件
```bash
npm run clean
```

## 📝 构建脚本说明

`build.js` 脚本提供了以下功能：

1. **依赖检查**: 自动检查并安装 electron-builder
2. **清理**: 清理旧的构建文件
3. **智能构建**: 优先尝试一键构建，失败时分别构建各平台
4. **结果展示**: 显示构建的文件大小和路径
5. **错误处理**: 友好的错误提示和处理

### 使用示例
```bash
# 查看帮助
node build.js --help

# 构建所有平台
node build.js

# 只构建 Windows
node build.js win

# 只构建 macOS
node build.js mac

# 只构建 Linux  
node build.js linux
```

## 🚨 常见问题

### 1. 构建失败
- 确保网络连接正常（需要下载依赖）
- 检查 Node.js 版本（推荐 16+）
- 清理 node_modules 重新安装

### 2. macOS 构建需要代码签名
如果不需要代码签名，可以设置：
```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
```

### 3. Linux 构建依赖
在某些 Linux 发行版上可能需要安装：
```bash
# Ubuntu/Debian
sudo apt-get install libnss3-dev libatk-bridge2.0-dev libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2

# CentOS/RHEL
sudo yum install nss atk at-spi2-atk libdrm libXcomposite libXdamage libXrandr mesa-libgbm libXScrnSaver alsa-lib
```

## 📈 性能优化

构建配置已经包含以下优化：

- **压缩**: 使用最大压缩减小文件大小
- **排除**: 排除不必要的文件（.map, .cache等）
- **架构**: 针对主流架构优化（x64, arm64）

## 🎯 发布流程

1. 更新版本号：`package.json` 中的 `version`
2. 构建所有平台：`npm run build`
3. 测试各平台版本
4. 上传到发布平台

---

💡 **提示**: 首次构建会下载 Electron 二进制文件，可能需要较长时间。后续构建会使用缓存，速度更快。 