#!/usr/bin/env node
/**
 * 迁移演示脚本
 * 演示如何逐步从 Firebase 迁移到国内服务
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

// 迁移步骤
const migrationSteps = [
  {
    name: '🔧 准备阶段',
    description: '当前使用 Firebase 服务',
    config: {
      NEXT_PUBLIC_USE_NEW_AUTH: false,
      NEXT_PUBLIC_USE_NEW_DATABASE: false,
      NEXT_PUBLIC_USE_NEW_STORAGE: false,
      NEXT_PUBLIC_USE_NEW_REALTIME: false
    }
  },
  {
    name: '🔐 认证迁移',
    description: '启用 JWT 认证系统',
    config: {
      NEXT_PUBLIC_USE_NEW_AUTH: true,
      NEXT_PUBLIC_USE_NEW_DATABASE: false,
      NEXT_PUBLIC_USE_NEW_STORAGE: false,
      NEXT_PUBLIC_USE_NEW_REALTIME: false
    }
  },
  {
    name: '📊 数据库迁移',
    description: '启用 MongoDB 数据库',
    config: {
      NEXT_PUBLIC_USE_NEW_AUTH: true,
      NEXT_PUBLIC_USE_NEW_DATABASE: true,
      NEXT_PUBLIC_USE_NEW_STORAGE: false,
      NEXT_PUBLIC_USE_NEW_REALTIME: false
    }
  },
  {
    name: '☁️ 存储迁移',
    description: '启用阿里云 OSS 存储',
    config: {
      NEXT_PUBLIC_USE_NEW_AUTH: true,
      NEXT_PUBLIC_USE_NEW_DATABASE: true,
      NEXT_PUBLIC_USE_NEW_STORAGE: true,
      NEXT_PUBLIC_USE_NEW_REALTIME: false
    }
  },
  {
    name: '⚡ 完成迁移',
    description: '启用 WebSocket 实时通信',
    config: {
      NEXT_PUBLIC_USE_NEW_AUTH: true,
      NEXT_PUBLIC_USE_NEW_DATABASE: true,
      NEXT_PUBLIC_USE_NEW_STORAGE: true,
      NEXT_PUBLIC_USE_NEW_REALTIME: true
    }
  }
];

function updateEnvFile(config) {
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local 文件不存在');
    return false;
  }

  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // 更新配置
  Object.entries(config).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine);
    } else {
      envContent += `\n${newLine}`;
    }
  });

  fs.writeFileSync(envPath, envContent);
  return true;
}

function showCurrentStatus() {
  console.log('\n📊 当前迁移状态：');
  
  const config = {
    auth: process.env.NEXT_PUBLIC_USE_NEW_AUTH === 'true',
    database: process.env.NEXT_PUBLIC_USE_NEW_DATABASE === 'true',
    storage: process.env.NEXT_PUBLIC_USE_NEW_STORAGE === 'true',
    realtime: process.env.NEXT_PUBLIC_USE_NEW_REALTIME === 'true'
  };

  console.log(`  认证系统: ${config.auth ? '✅ JWT' : '🔄 Firebase Auth'}`);
  console.log(`  数据库:   ${config.database ? '✅ MongoDB' : '🔄 Firebase Firestore'}`);
  console.log(`  存储:     ${config.storage ? '✅ 阿里云 OSS' : '🔄 Firebase Storage'}`);
  console.log(`  实时通信: ${config.realtime ? '✅ WebSocket' : '🔄 Firebase Realtime'}`);

  const progress = Object.values(config).filter(Boolean).length;
  console.log(`\n进度: ${progress}/4 (${Math.round(progress/4*100)}%)`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🚀 HospiTakeAway 迁移管理工具\n');

  if (command === 'status') {
    showCurrentStatus();
    return;
  }

  if (command === 'step') {
    const stepIndex = parseInt(args[1]);
    
    if (isNaN(stepIndex) || stepIndex < 0 || stepIndex >= migrationSteps.length) {
      console.log('❌ 无效的步骤编号');
      console.log('\n可用步骤：');
      migrationSteps.forEach((step, index) => {
        console.log(`  ${index}: ${step.name} - ${step.description}`);
      });
      return;
    }

    const step = migrationSteps[stepIndex];
    console.log(`🔄 执行迁移步骤 ${stepIndex}: ${step.name}`);
    console.log(`📝 ${step.description}\n`);

    if (updateEnvFile(step.config)) {
      console.log('✅ 配置已更新');
      console.log('🔄 请重启开发服务器以应用更改\n');
      showCurrentStatus();
    }
    return;
  }

  // 显示帮助
  console.log('用法:');
  console.log('  node migrate.js status        - 显示当前迁移状态');
  console.log('  node migrate.js step <数字>   - 执行指定迁移步骤\n');
  
  console.log('迁移步骤:');
  migrationSteps.forEach((step, index) => {
    console.log(`  ${index}: ${step.name} - ${step.description}`);
  });

  console.log('\n示例:');
  console.log('  node migrate.js step 1  # 启用 JWT 认证');
  console.log('  node migrate.js step 2  # 启用 MongoDB 数据库');
}

if (require.main === module) {
  main();
}

module.exports = {
  migrationSteps,
  updateEnvFile,
  showCurrentStatus
};
