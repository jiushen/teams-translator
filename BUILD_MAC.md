# Mac版本构建指南

## 🍎 构建Mac版本的方法

由于Electron的跨平台限制，Mac版本需要在macOS系统上构建。以下是几种获得Mac版本的方法：

### 方法1: 使用GitHub Actions自动构建 (推荐) ⭐

我们已经配置了GitHub Actions，可以自动构建所有平台版本：

1. **将项目推送到GitHub**
2. **创建版本标签**：
   ```bash
   git tag v2.1.0
   git push origin v2.1.0
   ```
3. **自动构建**：GitHub Actions会自动构建Windows、Mac、Linux版本
4. **下载构建结果**：在GitHub Releases页面下载Mac版本

### 方法2: 在Mac电脑上本地构建

如果您有Mac电脑，可以直接构建：

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd teams-translator

# 2. 安装依赖
npm install

# 3. 构建Mac版本
npm run build-mac

# 或使用我们的跨平台脚本
npm run build-cross
```

### 方法3: 使用云端Mac服务

可以使用以下云端Mac服务：
- **GitHub Codespaces** (推荐)
- **MacStadium**
- **AWS EC2 Mac实例**
- **租用Mac云服务器**

### 方法4: 虚拟机 (不推荐)

虽然可以在虚拟机中运行macOS，但这违反了Apple的许可协议，不推荐使用。

## 📦 构建输出

Mac版本会生成以下文件：
- `Teams翻译助手-2.1.0-x64.dmg` - Intel Mac安装包
- `Teams翻译助手-2.1.0-arm64.dmg` - Apple Silicon Mac安装包
- `Teams翻译助手-2.1.0-x64.zip` - Intel Mac便携版
- `Teams翻译助手-2.1.0-arm64.zip` - Apple Silicon Mac便携版

## 🔧 构建配置

项目已配置支持：
- ✅ **Intel Mac** (x64)
- ✅ **Apple Silicon Mac** (arm64/M1/M2/M3)
- ✅ **代码签名** (需要开发者证书)
- ✅ **公证** (需要Apple ID)

## 🚀 推荐方案

**最简单的方案是使用GitHub Actions**：

1. 将代码推送到GitHub
2. 创建版本标签触发自动构建
3. 等待几分钟后在Releases页面下载Mac版本

这样可以同时获得所有平台的版本，无需任何额外设置！

## 📞 需要帮助？

如果您需要Mac版本但无法自行构建，可以：
1. 提供GitHub仓库链接，我们帮您设置自动构建
2. 使用我们提供的GitHub Actions配置
3. 联系我们获取预构建版本

---

💡 **提示**：GitHub Actions是免费的，每月有充足的构建时间配额，非常适合开源项目使用！ 