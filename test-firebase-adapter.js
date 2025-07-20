/**
 * Firebase 适配器测试脚本
 * 验证新创建的 firebase.ts 适配器是否工作正常
 */

const { db, auth, storage, migrationStatus, checkCompatibility } = require('./src/lib/firebase.ts');

async function testFirebaseAdapter() {
  console.log('🧪 开始测试 Firebase 适配器...\n');
  
  try {
    // 检查兼容性
    console.log('1. 检查兼容性状态:');
    checkCompatibility();
    console.log('');
    
    // 测试数据库适配器
    console.log('2. 测试数据库适配器:');
    if (db) {
      console.log('✅ 数据库适配器已加载');
      console.log('   类型:', typeof db);
      console.log('   方法:', Object.getOwnPropertyNames(db).slice(0, 5), '...');
    } else {
      console.log('❌ 数据库适配器未加载');
    }
    console.log('');
    
    // 测试认证适配器
    console.log('3. 测试认证适配器:');
    if (auth) {
      console.log('✅ 认证适配器已加载');
      console.log('   类型:', typeof auth);
      console.log('   当前用户:', auth.currentUser ? '已登录' : '未登录');
    } else {
      console.log('❌ 认证适配器未加载');
    }
    console.log('');
    
    // 测试存储适配器
    console.log('4. 测试存储适配器:');
    if (storage) {
      console.log('✅ 存储适配器已加载');
      console.log('   类型:', typeof storage);
    } else {
      console.log('❌ 存储适配器未加载');
    }
    console.log('');
    
    // 显示迁移状态
    console.log('5. 迁移状态详情:');
    console.log('   数据库:', migrationStatus.database ? '✅ 新服务' : '⚠️ Firebase');
    console.log('   认证:', migrationStatus.auth ? '✅ 新服务' : '⚠️ Firebase');
    console.log('   存储:', migrationStatus.storage ? '✅ 新服务' : '⚠️ Firebase');
    console.log('   实时:', migrationStatus.realtime ? '✅ 新服务' : '⚠️ Firebase');
    console.log('');
    
    console.log('🎉 Firebase 适配器测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行测试
testFirebaseAdapter();
