#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建 Teams翻译助手 跨平台版本...\n');

// 检查必要的依赖
function checkDependencies() {
  console.log('📦 检查依赖...');
  try {
    execSync('npm list electron-builder', { stdio: 'ignore' });
    console.log('✅ electron-builder 已安装');
  } catch (error) {
    console.log('❌ electron-builder 未安装，正在安装...');
    execSync('npm install --save-dev electron-builder', { stdio: 'inherit' });
  }
}

// 清理旧的构建文件
function cleanDist() {
  console.log('🧹 清理旧的构建文件...');
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
  }
  console.log('✅ 清理完成');
}

// 构建特定平台
function buildPlatform(platform, description) {
  console.log(`\n🔨 构建 ${description}...`);
  try {
    const startTime = Date.now();
    execSync(`npm run build-${platform}`, { stdio: 'inherit' });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ ${description} 构建完成 (${duration}s)`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} 构建失败:`, error.message);
    return false;
  }
}

// 构建所有平台
function buildAll() {
  console.log('\n🌍 构建所有平台版本...');
  try {
    const startTime = Date.now();
    execSync('npm run build-all', { stdio: 'inherit' });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ 所有平台构建完成 (${duration}s)`);
    return true;
  } catch (error) {
    console.log('❌ 构建失败，尝试单独构建各平台...');
    return false;
  }
}

// 显示构建结果
function showResults() {
  console.log('\n📊 构建结果:');
  const distPath = path.join(__dirname, 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ 没有找到构建文件');
    return;
  }

  const files = fs.readdirSync(distPath);
  const results = {
    windows: [],
    mac: [],
    linux: []
  };

  files.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(1);
    
    if (file.includes('win') || file.includes('setup') || file.includes('portable')) {
      results.windows.push(`${file} (${sizeInMB} MB)`);
    } else if (file.includes('mac') || file.includes('dmg') || file.includes('zip')) {
      results.mac.push(`${file} (${sizeInMB} MB)`);
    } else if (file.includes('linux') || file.includes('AppImage') || file.includes('deb') || file.includes('tar.gz')) {
      results.linux.push(`${file} (${sizeInMB} MB)`);
    }
  });

  console.log('\n🪟 Windows 版本:');
  results.windows.forEach(file => console.log(`  • ${file}`));
  
  console.log('\n🍎 macOS 版本:');
  results.mac.forEach(file => console.log(`  • ${file}`));
  
  console.log('\n🐧 Linux 版本:');
  results.linux.forEach(file => console.log(`  • ${file}`));

  console.log(`\n📁 所有文件保存在: ${distPath}`);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const platform = args[0];

  try {
    checkDependencies();
    cleanDist();

    let success = false;

    if (platform === 'win' || platform === 'windows') {
      success = buildPlatform('win', 'Windows 版本');
    } else if (platform === 'mac' || platform === 'macos') {
      success = buildPlatform('mac', 'macOS 版本');
    } else if (platform === 'linux') {
      success = buildPlatform('linux', 'Linux 版本');
    } else {
      // 构建所有平台
      success = buildAll();
      
      // 如果一键构建失败，尝试分别构建
      if (!success) {
        console.log('\n🔄 尝试分别构建各平台...');
        const results = [];
        results.push(buildPlatform('win', 'Windows 版本'));
        results.push(buildPlatform('mac', 'macOS 版本'));
        results.push(buildPlatform('linux', 'Linux 版本'));
        success = results.some(r => r);
      }
    }

    if (success) {
      showResults();
      console.log('\n🎉 构建完成！');
    } else {
      console.log('\n💥 构建失败！');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ 构建过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 显示使用说明
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📖 使用说明:

  node build.js              构建所有平台
  node build.js win          仅构建 Windows 版本
  node build.js mac          仅构建 macOS 版本
  node build.js linux        仅构建 Linux 版本

🎯 构建产物:
  • Windows: .exe 安装包 + 便携版
  • macOS: .dmg 磁盘映像 + .zip 压缩包
  • Linux: AppImage + .deb 包 + .tar.gz 压缩包

💡 提示:
  • 首次构建会下载依赖，耗时较长
  • 跨平台构建需要对应平台的环境
  • 在 Windows 上无法构建 macOS 版本
`);
  process.exit(0);
}

main();