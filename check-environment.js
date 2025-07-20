// check-environment.js - 环境验证脚本
const { MongoClient } = require('mongodb');

async function checkEnvironment() {
  console.log('🔍 HospiTakeAway 环境检查\n');
  
  // 检查 Node.js 版本
  console.log('📦 Node.js 版本:', process.version);
  
  // 检查环境变量
  console.log('\n🔧 环境配置:');
  const requiredEnvs = [
    'MONGODB_URI',
    'MONGODB_DB_NAME',
    'JWT_SECRET',
    'ALI_OSS_ACCESS_KEY_ID',
    'ALI_OSS_ACCESS_KEY_SECRET'
  ];
  
  let envValid = true;
  for (const env of requiredEnvs) {
    const value = process.env[env];
    if (value) {
      console.log(`✅ ${env}: ${env === 'JWT_SECRET' ? '[已设置]' : value}`);
    } else {
      console.log(`❌ ${env}: 未设置`);
      envValid = false;
    }
  }
  
  // 检查 MongoDB 连接
  console.log('\n🗄️ 数据库连接测试:');
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI 未设置');
    }
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ MongoDB 连接成功');
    
    // 创建测试集合
    const db = client.db(process.env.MONGODB_DB_NAME || 'hospitakeaway');
    const testCollection = db.collection('test_connection');
    
    // 插入测试数据
    const testDoc = { 
      message: 'HospiTakeAway 连接测试', 
      timestamp: new Date(),
      version: '1.0.0' 
    };
    
    await testCollection.insertOne(testDoc);
    console.log('✅ 数据库写入测试成功');
    
    // 读取测试数据
    const result = await testCollection.findOne({ message: 'HospiTakeAway 连接测试' });
    if (result) {
      console.log('✅ 数据库读取测试成功');
    }
    
    // 清理测试数据
    await testCollection.deleteMany({ message: 'HospiTakeAway 连接测试' });
    console.log('✅ 测试数据清理完成');
    
    await client.close();
    
  } catch (error) {
    console.log('❌ MongoDB 连接失败:', error.message);
    envValid = false;
  }
  
  // 迁移建议
  console.log('\n🚀 迁移建议:');
  if (envValid) {
    console.log('✅ 环境配置完成，可以开始迁移！');
    console.log('\n📋 下一步操作:');
    console.log('1. 启用 JWT 认证: 设置 NEXT_PUBLIC_USE_NEW_AUTH=true');
    console.log('2. 启用 MongoDB: 设置 NEXT_PUBLIC_USE_NEW_DATABASE=true'); 
    console.log('3. 重启开发服务器查看效果');
  } else {
    console.log('⚠️ 请先解决上述配置问题');
  }
  
  console.log('\n🌐 访问链接:');
  console.log('- 项目主页: http://localhost:9002');
  console.log('- 迁移面板: http://localhost:9002/admin/migration');
}

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

// 运行检查
checkEnvironment().catch(console.error);
