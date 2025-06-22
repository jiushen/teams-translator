# GitHub Actions 自动构建指南

## 🎯 概述

本项目配置了GitHub Actions工作流程，可以自动构建Windows、macOS和Linux三个平台的可执行文件。

## 📁 工作流程文件

- `.github/workflows/build.yml` - 传统版本（使用旧版Actions）
- `.github/workflows/build-modern.yml` - 现代版本（推荐使用）

## 🚀 触发构建的方式

### 方式1：推送标签（推荐）

```bash
# 创建并推送标签
git tag v2.1.0
git push origin v2.1.0
```

### 方式2：手动触发

1. 打开GitHub仓库页面
2. 点击 "Actions" 标签页
3. 选择 "Build and Release (Modern)" 工作流程
4. 点击 "Run workflow" 按钮
5. 输入版本号（如：v2.1.0）
6. 点击绿色的 "Run workflow" 按钮

## 📦 构建产物

构建完成后，会生成以下文件：

### Windows
- `Teams翻译助手-v2.1.0-x64-setup.exe` - 安装版
- `Teams翻译助手-v2.1.0-x64-portable.exe` - 便携版

### macOS
- `Teams翻译助手-v2.1.0-x64.dmg` - Intel Mac版本
- `Teams翻译助手-v2.1.0-arm64.dmg` - Apple Silicon版本

### Linux
- `Teams翻译助手-v2.1.0-x64.AppImage` - AppImage格式（推荐）
- `Teams翻译助手-v2.1.0-x64.deb` - Debian包
- `Teams翻译助手-v2.1.0-x64.tar.gz` - 压缩包

## 🔧 构建配置

### 支持的平台和架构

| 平台 | 架构 | 格式 |
|------|------|------|
| Windows | x64 | NSIS安装包、便携版 |
| macOS | x64, arm64 | DMG镜像、ZIP压缩包 |
| Linux | x64 | AppImage、DEB包、TAR.GZ |

### 构建环境

- **Node.js**: 18.x
- **Electron Builder**: 24.x
- **操作系统**: 
  - Windows: windows-latest
  - macOS: macos-latest  
  - Linux: ubuntu-latest

## 📋 构建步骤

1. **检出代码** - 获取最新代码
2. **设置Node.js环境** - 安装Node.js 18.x
3. **安装依赖** - 运行 `npm ci`
4. **构建应用** - 运行对应平台的构建命令
5. **上传构建产物** - 保存构建结果
6. **创建Release** - 自动创建GitHub Release
7. **上传发布文件** - 将构建产物添加到Release

## 🛠️ 本地构建命令

如果需要在本地构建，可以使用以下命令：

```bash
# 安装依赖
npm install

# 构建所有平台（需要对应平台环境）
npm run build-all

# 构建特定平台
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux
```

## 🔍 故障排除

### 常见问题

1. **构建失败** - 检查package.json中的构建配置
2. **权限问题** - 确保GitHub Token有足够权限
3. **依赖问题** - 确保所有依赖都在package.json中正确声明

### 调试方法

1. 查看GitHub Actions日志
2. 检查构建配置是否正确
3. 验证electron-builder配置

## 📈 优化建议

1. **缓存优化** - 使用npm缓存加速构建
2. **并行构建** - 多平台并行构建节省时间
3. **失败容错** - 单个平台失败不影响其他平台
4. **构建产物管理** - 自动清理旧的构建产物

## 🔐 安全注意事项

1. **API密钥** - 不要在代码中硬编码API密钥
2. **签名证书** - macOS需要禁用代码签名或配置证书
3. **权限控制** - 合理设置GitHub Actions权限

## 📚 相关文档

- [Electron Builder文档](https://www.electron.build/)
- [GitHub Actions文档](https://docs.github.com/en/actions)
- [Node.js官方文档](https://nodejs.org/docs/)

## 🎉 发布流程

1. 确保代码已推送到main分支
2. 创建并推送版本标签
3. 等待GitHub Actions完成构建
4. 检查Release页面的构建产物
5. 测试下载的可执行文件
6. 发布Release（如果设置为草稿） 