@echo off
chcp 65001 >nul
echo.
echo 🚀 Teams翻译助手 - GitHub仓库设置脚本
echo ==========================================
echo.

REM 检查是否已经是Git仓库
if exist .git (
    echo ✅ 检测到已有Git仓库
) else (
    echo 📦 初始化Git仓库...
    git init
    if errorlevel 1 (
        echo ❌ Git初始化失败，请确保已安装Git
        pause
        exit /b 1
    )
)

echo.
echo 📝 请输入您的GitHub信息：
echo.

REM 获取用户输入
set /p USERNAME="GitHub用户名: "
set /p EMAIL="GitHub邮箱: "

if "%USERNAME%"=="" (
    echo ❌ 用户名不能为空
    pause
    exit /b 1
)

if "%EMAIL%"=="" (
    echo ❌ 邮箱不能为空
    pause
    exit /b 1
)

echo.
echo 🔧 配置Git用户信息...
git config user.name "%USERNAME%"
git config user.email "%EMAIL%"

echo ✅ Git配置完成
echo   用户名: %USERNAME%
echo   邮箱: %EMAIL%
echo.

REM 检查是否已有远程仓库
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo 🌐 添加GitHub远程仓库...
    set REPO_URL=https://github.com/%USERNAME%/teams-translator.git
    echo   仓库地址: !REPO_URL!
    git remote add origin !REPO_URL!
    echo ✅ 远程仓库添加完成
) else (
    echo ✅ 远程仓库已存在
)

echo.
echo 📂 添加项目文件...
git add .

echo.
echo 💾 提交代码...
git commit -m "初始提交：Teams翻译助手v2.1.0

- 跨平台Electron应用
- 支持剪贴板监听翻译  
- 多AI模型支持(OpenAI + DeepSeek)
- 自定义术语词典
- 翻译结果样式配置
- GitHub Actions自动构建"

if errorlevel 1 (
    echo ⚠️  提交失败或没有变更
) else (
    echo ✅ 代码提交完成
)

echo.
echo 🚀 推送到GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ⚠️  推送失败，可能的原因：
    echo   1. 仓库不存在，请先在GitHub创建仓库
    echo   2. 网络连接问题
    echo   3. 权限不足
    echo.
    echo 💡 请按照以下步骤操作：
    echo   1. 访问 https://github.com/new
    echo   2. 仓库名设为: teams-translator
    echo   3. 选择Public，勾选Add README
    echo   4. 创建后重新运行此脚本
    echo.
) else (
    echo ✅ 代码推送完成
    echo.
    echo 🏷️  创建版本标签...
    git tag -a v2.1.0 -m "发布版本 v2.1.0"
    git push origin v2.1.0
    
    if errorlevel 1 (
        echo ⚠️  标签推送失败
    ) else (
        echo ✅ 版本标签创建完成
        echo.
        echo 🎉 设置完成！请访问以下链接：
        echo   📁 仓库地址: https://github.com/%USERNAME%/teams-translator
        echo   ⚙️  Actions: https://github.com/%USERNAME%/teams-translator/actions
        echo   📦 Releases: https://github.com/%USERNAME%/teams-translator/releases
        echo.
        echo 🔄 GitHub Actions将自动构建所有平台版本（约15分钟）
    )
)

echo.
echo 按任意键退出...
pause >nul 