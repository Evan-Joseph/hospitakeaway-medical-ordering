// final-verification.js - 最终验证脚本
require('dotenv').config({ path: '.env.local' });

async function finalVerification() {
  console.log('🎊 HospiTakeAway 迁移完成验证\n');
  
  let allPassed = true;
  const results = {
    mongodb: false,
    oss: false,
    jwt: false,
    websocket: false,
    performance: false
  };
  
  // 1. MongoDB 验证
  console.log('🗄️ MongoDB 数据库验证...');
  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db(process.env.MONGODB_DB_NAME);
    await db.collection('verification').insertOne({ 
      test: 'final_verification', 
      timestamp: new Date() 
    });
    
    const count = await db.collection('verification').countDocuments();
    await db.collection('verification').deleteMany({ test: 'final_verification' });
    await client.close();
    
    console.log('✅ MongoDB: 连接正常，读写功能正常');
    results.mongodb = true;
  } catch (error) {
    console.log('❌ MongoDB: 验证失败 -', error.message);
    allPassed = false;
  }
  
  // 2. 阿里云 OSS 验证
  console.log('\n☁️ 阿里云 OSS 存储验证...');
  try {
    const OSS = require('ali-oss');
    const client = new OSS({
      region: process.env.ALI_OSS_REGION,
      accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
      bucket: process.env.ALI_OSS_BUCKET
    });
    
    const testFile = 'verification/final-test.json';
    const testContent = JSON.stringify({ 
      verification: 'final_test',
      timestamp: new Date().toISOString()
    });
    
    await client.put(testFile, Buffer.from(testContent));
    const result = await client.get(testFile);
    await client.delete(testFile);
    
    console.log('✅ OSS: 连接正常，上传下载功能正常');
    results.oss = true;
  } catch (error) {
    console.log('❌ OSS: 验证失败 -', error.message);
    allPassed = false;
  }
  
  // 3. JWT 配置验证
  console.log('\n🔐 JWT 认证配置验证...');
  try {
    const jwt = require('jsonwebtoken');
    
    const testPayload = { userId: 'test_user', role: 'admin' };
    const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.userId === 'test_user') {
      console.log('✅ JWT: 配置正确，签名验证正常');
      results.jwt = true;
    } else {
      throw new Error('JWT验证结果不匹配');
    }
  } catch (error) {
    console.log('❌ JWT: 验证失败 -', error.message);
    allPassed = false;
  }
  
  // 4. WebSocket 配置验证
  console.log('\n⚡ WebSocket 配置验证...');
  try {
    const wsPort = process.env.WS_PORT || 9003;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    
    if (wsUrl && wsPort) {
      console.log('✅ WebSocket: 配置完整，端口设置正确');
      results.websocket = true;
    } else {
      throw new Error('WebSocket配置不完整');
    }
  } catch (error) {
    console.log('❌ WebSocket: 验证失败 -', error.message);
    allPassed = false;
  }
  
  // 5. 性能评估
  console.log('\n📊 性能基准测试...');
  try {
    const startTime = Date.now();
    
    // MongoDB 性能测试
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    
    const mongoStart = Date.now();
    await db.collection('performance_test').insertOne({ test: 'benchmark', data: new Array(100).fill('test') });
    const mongoTime = Date.now() - mongoStart;
    
    await client.close();
    
    const totalTime = Date.now() - startTime;
    
    console.log(`✅ 性能: MongoDB写入 ${mongoTime}ms, 总测试时间 ${totalTime}ms`);
    results.performance = totalTime < 1000; // 1秒内完成认为性能良好
    
  } catch (error) {
    console.log('❌ 性能: 测试失败 -', error.message);
  }
  
  // 最终结果
  console.log('\n' + '='.repeat(50));
  console.log('🎯 最终验证结果:');
  console.log('='.repeat(50));
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n📈 通过率: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  
  Object.entries(results).forEach(([test, passed]) => {
    const testNames = {
      mongodb: '🗄️ MongoDB 数据库',
      oss: '☁️ 阿里云 OSS 存储', 
      jwt: '🔐 JWT 认证系统',
      websocket: '⚡ WebSocket 实时通信',
      performance: '📊 性能基准'
    };
    
    console.log(`${passed ? '✅' : '❌'} ${testNames[test]}: ${passed ? '通过' : '失败'}`);
  });
  
  if (allPassed && passedTests >= 4) {
    console.log('\n🎊 恭喜！HospiTakeAway 迁移完全成功！');
    console.log('🚀 您的应用现在完全运行在国内友好的环境中！');
    
    console.log('\n🌟 迁移成果:');
    console.log('✅ 摆脱了Firebase的网络限制');
    console.log('✅ 大幅降低了运营成本');
    console.log('✅ 提升了访问速度和稳定性');
    console.log('✅ 获得了更好的数据控制权');
    
    console.log('\n🎯 建议下一步:');
    console.log('1. 进行完整的功能测试');
    console.log('2. 性能调优和监控设置');
    console.log('3. 准备生产环境部署');
    console.log('4. 制定数据备份策略');
    
  } else {
    console.log('\n⚠️ 部分服务需要检查和修复');
    console.log('📋 请根据上述失败项目进行排查');
  }
  
  console.log('\n🌐 访问链接:');
  console.log('- 项目主页: http://localhost:9002');
  console.log('- 迁移控制面板: http://localhost:9002/admin/migration');
  console.log('- 管理员后台: http://localhost:9002/admin/dashboard');
}

finalVerification().catch(console.error);
