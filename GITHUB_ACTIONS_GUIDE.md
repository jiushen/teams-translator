# GitHub Actions自动构建指南

## 🎯 概述

GitHub Actions是GitHub提供的免费CI/CD服务，可以自动构建Windows、Mac、Linux三个平台的版本。我们已经为项目配置好了完整的自动构建流程。

## 🚀 快速开始

### 第1步：创建GitHub仓库

1. **登录GitHub**，点击右上角的 `+` → `New repository`

2. **填写仓库信息**：
   ```
   Repository name: teams-translator
   Description: Teams实时翻译助手 - 跨平台版
   ✅ Public (推荐，可以使用免费的GitHub Actions)
   ✅ Add a README file
   Choose a license: MIT License
   ```

3. **点击 "Create repository"**

### 第2步：上传项目代码

```bash
# 在项目目录中初始化Git
cd D:\work\compare069\teams-translator
git init

# 添加GitHub远程仓库 (替换为您的仓库地址)
git remote add origin https://github.com/您的用户名/teams-translator.git

# 添加所有文件
git add .

# 提交代码
git commit -m "初始提交：Teams翻译助手v2.1.0"

# 推送到GitHub
git push -u origin main
```

### 第3步：触发自动构建

```bash
# 创建版本标签
git tag v2.1.0

# 推送标签触发构建
git push origin v2.1.0
```

### 第4步：等待构建完成

1. 在GitHub仓库页面点击 **"Actions"** 标签
2. 可以看到自动开始的构建任务
3. 等待约10-15分钟构建完成
4. 在 **"Releases"** 页面下载各平台版本

## 📋 详细步骤说明

### 1. GitHub仓库设置

#### 1.1 创建仓库
- 访问 https://github.com/new
- 仓库名称：`teams-translator`
- 描述：`Teams实时翻译助手 - 跨平台版`
- 选择 **Public** (免费使用Actions)
- 勾选 **Add a README file**
- 许可证选择 **MIT License**

#### 1.2 获取仓库地址
创建后复制仓库的HTTPS地址，格式如：
```
https://github.com/您的用户名/teams-translator.git
```

### 2. 本地Git配置

#### 2.1 初始化仓库
```bash
# 进入项目目录
cd D:\work\compare069\teams-translator

# 初始化Git仓库
git init

# 配置用户信息 (首次使用Git需要)
git config user.name "您的用户名"
git config user.email "您的邮箱"
```

#### 2.2 添加远程仓库
```bash
# 添加GitHub远程仓库
git remote add origin https://github.com/您的用户名/teams-translator.git

# 验证远程仓库
git remote -v
```

#### 2.3 推送代码
```bash
# 添加所有文件到暂存区
git add .

# 提交代码
git commit -m "初始提交：Teams翻译助手v2.1.0

- 跨平台Electron应用
- 支持剪贴板监听翻译
- 多AI模型支持(OpenAI + DeepSeek)
- 自定义术语词典
- 翻译结果样式配置
- GitHub Actions自动构建"

# 推送到GitHub主分支
git push -u origin main
```

### 3. 触发自动构建

#### 3.1 创建版本标签
```bash
# 创建带注释的标签
git tag -a v2.1.0 -m "发布版本 v2.1.0

新功能：
- 跨平台支持(Windows/Mac/Linux)
- 剪贴板监听自动翻译
- 多AI模型集成
- 用户配置存储在用户目录

修复：
- 配置文件路径问题
- 剪贴板重复翻译问题
- 界面布局优化"

# 推送标签到GitHub
git push origin v2.1.0
```

#### 3.2 验证构建触发
1. 访问您的GitHub仓库
2. 点击 **"Actions"** 标签
3. 应该看到名为 **"Build and Release"** 的工作流开始运行

### 4. 监控构建过程

#### 4.1 查看构建状态
- **绿色圆圈** ✅ - 构建成功
- **黄色圆圈** 🟡 - 构建进行中
- **红色叉号** ❌ - 构建失败

#### 4.2 查看构建日志
1. 点击具体的构建任务
2. 展开各个步骤查看详细日志
3. 如果失败，查看错误信息

#### 4.3 构建时间估算
- **Windows**: 约5-8分钟
- **macOS**: 约8-12分钟  
- **Linux**: 约5-8分钟
- **总计**: 约15-20分钟

### 5. 下载构建结果

#### 5.1 从Releases下载 (推荐)
1. 构建成功后，访问仓库的 **"Releases"** 页面
2. 下载对应平台的安装包：
   - `Teams翻译助手-2.1.0-x64-setup.exe` - Windows安装版
   - `Teams翻译助手-2.1.0-x64-portable.exe` - Windows便携版
   - `Teams翻译助手-2.1.0-x64.dmg` - Intel Mac
   - `Teams翻译助手-2.1.0-arm64.dmg` - Apple Silicon Mac
   - `Teams翻译助手-2.1.0-x64.AppImage` - Linux通用版

#### 5.2 从Artifacts下载
1. 在 **"Actions"** 页面点击构建任务
2. 在页面底部的 **"Artifacts"** 区域下载
3. 注意：Artifacts会在30天后自动删除

## 🔧 高级配置

### 自定义构建触发条件

编辑 `.github/workflows/build.yml`：

```yaml
# 推送到main分支时也触发构建
on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:  # 手动触发
```

### 手动触发构建

1. 访问仓库的 **"Actions"** 页面
2. 选择 **"Build and Release"** 工作流
3. 点击 **"Run workflow"** 按钮
4. 选择分支并点击 **"Run workflow"**

### 添加构建状态徽章

在README.md中添加：
```markdown
![Build Status](https://github.com/您的用户名/teams-translator/workflows/Build%20and%20Release/badge.svg)
```

## 🐛 常见问题

### Q1: 构建失败怎么办？
**A**: 
1. 查看Actions页面的错误日志
2. 常见问题：
   - 依赖安装失败：检查package.json
   - 权限问题：确保GITHUB_TOKEN有权限
   - 文件路径问题：检查相对路径

### Q2: Mac构建失败？
**A**: 
1. 检查entitlements.mac.plist文件是否存在
2. 确保build目录下有必要的Mac配置文件
3. 代码签名问题可以暂时忽略（不影响使用）

### Q3: 如何更新版本？
**A**:
```bash
# 修改代码后
git add .
git commit -m "更新到v2.1.1"
git push

# 创建新版本标签
git tag v2.1.1
git push origin v2.1.1
```

### Q4: Actions配额不够？
**A**:
- 公开仓库：每月2000分钟免费
- 私有仓库：每月500分钟免费
- 可以购买更多配额或优化构建时间

## 💡 最佳实践

### 1. 版本管理
- 使用语义化版本号：`v主版本.次版本.修订号`
- 每次发布前测试所有功能
- 在标签消息中详细描述更新内容

### 2. 构建优化
- 缓存node_modules加速构建
- 并行构建多个平台
- 只在标签推送时构建发布版

### 3. 安全考虑
- 不要在代码中硬编码API密钥
- 使用GitHub Secrets存储敏感信息
- 定期更新依赖包

---

🎉 **恭喜！** 现在您已经掌握了使用GitHub Actions自动构建跨平台应用的完整流程！ 