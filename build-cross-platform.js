#!/usr/bin/env node

const { exec } = require('child_process');
const os = require('os');
const path = require('path');

console.log('🚀 Teams翻译助手 - 跨平台构建脚本');
console.log('=====================================');

const platform = os.platform();
const arch = os.arch();

console.log(`当前系统: ${platform} (${arch})`);
console.log('');

// 构建配置
const buildConfigs = {
  win32: {
    name: 'Windows',
    command: 'npm run build-win',
    supported: true,
    outputs: ['*.exe', '*.exe.blockmap']
  },
  darwin: {
    name: 'macOS', 
    command: 'npm run build-mac',
    supported: platform === 'darwin',
    outputs: ['*.dmg', '*.zip']
  },
  linux: {
    name: 'Linux',
    command: 'npm run build-linux', 
    supported: platform === 'linux',
    outputs: ['*.AppImage', '*.deb', '*.tar.gz']
  }
};

// 显示支持的平台
console.log('📋 构建支持情况:');
for (const [key, config] of Object.entries(buildConfigs)) {
  const status = config.supported ? '✅ 支持' : '❌ 不支持 (需要对应系统)';
  console.log(`  ${config.name}: ${status}`);
}
console.log('');

// 执行构建
async function buildPlatform(platformKey) {
  const config = buildConfigs[platformKey];
  
  if (!config.supported) {
    console.log(`⚠️  跳过 ${config.name} 构建 - 需要在对应系统上运行`);
    return false;
  }
  
  console.log(`🔨 开始构建 ${config.name} 版本...`);
  
  return new Promise((resolve, reject) => {
    const child = exec(config.command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ ${config.name} 构建失败:`, error.message);
        reject(error);
        return;
      }
      
      console.log(`✅ ${config.name} 构建完成!`);
      console.log(`📦 输出文件: ${config.outputs.join(', ')}`);
      resolve(true);
    });
    
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // 构建当前平台支持的版本
    console.log('🎯 自动构建当前平台支持的版本...\n');
    
    for (const [key, config] of Object.entries(buildConfigs)) {
      if (config.supported) {
        try {
          await buildPlatform(key);
          console.log('');
        } catch (error) {
          console.error(`构建 ${config.name} 时出错:`, error.message);
        }
      }
    }
  } else {
    // 构建指定平台
    const targetPlatform = args[0];
    
    if (!buildConfigs[targetPlatform]) {
      console.error(`❌ 不支持的平台: ${targetPlatform}`);
      console.log(`支持的平台: ${Object.keys(buildConfigs).join(', ')}`);
      process.exit(1);
    }
    
    try {
      await buildPlatform(targetPlatform);
    } catch (error) {
      console.error(`构建失败:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('🎉 构建完成!');
  console.log('📁 输出目录: ./dist/');
}

// 显示使用说明
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('使用说明:');
  console.log('  node build-cross-platform.js          # 构建当前平台支持的版本');
  console.log('  node build-cross-platform.js win32    # 构建Windows版本');
  console.log('  node build-cross-platform.js darwin   # 构建macOS版本');
  console.log('  node build-cross-platform.js linux    # 构建Linux版本');
  console.log('');
  console.log('注意: 某些平台需要在对应的操作系统上构建');
  process.exit(0);
}

main().catch(console.error); 