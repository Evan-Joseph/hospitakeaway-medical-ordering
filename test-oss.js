// test-oss.js - OSS连接测试脚本
require('dotenv').config({ path: '.env.local' });

async function testOSSConnection() {
  console.log('🔍 阿里云OSS连接测试\n');
  
  // 检查配置
  console.log('📋 配置检查:');
  const requiredEnvs = [
    'ALI_OSS_ACCESS_KEY_ID',
    'ALI_OSS_ACCESS_KEY_SECRET', 
    'ALI_OSS_BUCKET',
    'ALI_OSS_REGION'
  ];
  
  let configValid = true;
  for (const env of requiredEnvs) {
    const value = process.env[env];
    if (value && value !== 'your_access_key_id_here' && value !== 'your_access_key_secret_here') {
      console.log(`✅ ${env}: ${env.includes('SECRET') ? '[已设置]' : value}`);
    } else {
      console.log(`❌ ${env}: 未配置或使用默认值`);
      configValid = false;
    }
  }
  
  if (!configValid) {
    console.log('\n⚠️ OSS配置不完整，无法进行连接测试');
    console.log('\n📋 配置步骤:');
    console.log('1. 登录阿里云控制台: https://oss.console.aliyun.com');
    console.log('2. 创建Bucket: hospitakeaway-files');
    console.log('3. 获取AccessKey: 右上角头像 → AccessKey管理');
    console.log('4. 编辑 .env.local 文件，填入真实的配置信息');
    return;
  }
  
  // 测试OSS连接
  console.log('\n☁️ OSS连接测试:');
  try {
    const OSS = require('ali-oss');
    
    const client = new OSS({
      region: process.env.ALI_OSS_REGION,
      accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
      bucket: process.env.ALI_OSS_BUCKET
    });
    
    // 测试权限 - 列出Bucket
    console.log('🔗 正在测试连接...');
    await client.list({
      prefix: 'test/',
      'max-keys': 1
    });
    console.log('✅ OSS连接成功');
    
    // 测试上传
    console.log('📤 正在测试上传...');
    const testContent = JSON.stringify({
      message: 'HospiTakeAway OSS 测试文件',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
    
    const uploadResult = await client.put('test/hospitakeaway-test.json', Buffer.from(testContent));
    console.log('✅ 文件上传成功');
    console.log(`📍 文件URL: ${uploadResult.url}`);
    
    // 测试下载
    console.log('📥 正在测试下载...');
    const downloadResult = await client.get('test/hospitakeaway-test.json');
    const downloadedContent = downloadResult.content.toString();
    const parsedContent = JSON.parse(downloadedContent);
    
    if (parsedContent.message === 'HospiTakeAway OSS 测试文件') {
      console.log('✅ 文件下载验证成功');
    }
    
    // 清理测试文件
    console.log('🧹 正在清理测试文件...');
    await client.delete('test/hospitakeaway-test.json');
    console.log('✅ 测试文件清理完成');
    
  } catch (error) {
    console.log('❌ OSS测试失败:', error.message);
    
    if (error.code) {
      console.log('\n🔧 错误分析:');
      switch (error.code) {
        case 'InvalidAccessKeyId':
          console.log('- AccessKey ID 无效，请检查配置');
          break;
        case 'SignatureDoesNotMatch':
          console.log('- AccessKey Secret 错误，请检查配置');
          break;
        case 'NoSuchBucket':
          console.log('- Bucket不存在，请先创建Bucket');
          break;
        case 'AccessDenied':
          console.log('- 权限不足，请检查AccessKey权限设置');
          break;
        default:
          console.log(`- 错误代码: ${error.code}`);
      }
    }
    
    configValid = false;
  }
  
  // 费用估算
  console.log('\n💰 费用估算（开发阶段）:');
  console.log('- 免费额度: 40GB存储 + 10GB流量/月（新用户6个月）');
  console.log('- 长期免费: 5GB存储 + 1GB流量/月');
  console.log('- 预估成本: ¥1-5/月（远低于免费额度）');
  
  // 迁移建议
  console.log('\n🚀 下一步操作:');
  if (configValid) {
    console.log('✅ OSS配置完成，可以启用存储迁移！');
    console.log('📝 在 .env.local 中设置: NEXT_PUBLIC_USE_NEW_STORAGE=true');
  } else {
    console.log('⚠️ 请先完成OSS配置');
    console.log('📖 参考文档: ALIYUN_OSS_SETUP.md');
  }
}

testOSSConnection().catch(console.error);
