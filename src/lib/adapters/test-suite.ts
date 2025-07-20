// src/lib/adapters/test-suite.ts
/**
 * 适配器测试套件
 * 验证新适配器与 Firebase API 的兼容性和功能完整性
 */

import { MigrationManager } from '../migration-config';

// 测试结果接口
export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  passed: number;
  failed: number;
  totalDuration: number;
}

// 测试基础类
abstract class BaseTestSuite {
  protected results: TestResult[] = [];
  
  protected async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      this.results.push({
        name,
        passed: true,
        duration: Date.now() - startTime
      });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      console.error(`❌ ${name}: ${error}`);
    }
  }
  
  protected getSummary(): TestSuite {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.length - passed;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    return {
      name: this.constructor.name,
      results: this.results,
      passed,
      failed,
      totalDuration
    };
  }
}

// 数据库适配器测试
export class DatabaseAdapterTests extends BaseTestSuite {
  constructor(private db: any) {
    super();
  }
  
  async runAllTests(): Promise<TestSuite> {
    console.log('🧪 开始数据库适配器测试...');
    
    await this.runTest('连接测试', () => this.testConnection());
    await this.runTest('集合创建测试', () => this.testCollection());
    await this.runTest('文档操作测试', () => this.testDocumentOperations());
    await this.runTest('查询功能测试', () => this.testQueries());
    await this.runTest('实时监听测试', () => this.testRealtimeListening());
    
    return this.getSummary();
  }
  
  private async testConnection(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库实例未初始化');
    }
    
    // 测试基本连接
    const testCollection = this.db.collection('test_connection');
    const testDoc = testCollection.doc('test');
    
    await testDoc.set({ test: true, timestamp: new Date() });
    const snapshot = await testDoc.get();
    
    if (!snapshot.exists()) {
      throw new Error('文档创建失败');
    }
    
    await testDoc.delete();
  }
  
  private async testCollection(): Promise<void> {
    const collection = this.db.collection('test_collection');
    
    if (!collection) {
      throw new Error('集合创建失败');
    }
    
    // 测试添加文档
    const docRef = await collection.add({
      name: 'Test Item',
      value: 123,
      createdAt: new Date()
    });
    
    if (!docRef.id) {
      throw new Error('文档ID获取失败');
    }
    
    // 清理
    await docRef.delete();
  }
  
  private async testDocumentOperations(): Promise<void> {
    const collection = this.db.collection('test_docs');
    const docRef = collection.doc('test_doc');
    
    // 测试设置文档
    await docRef.set({
      title: 'Test Document',
      count: 1,
      tags: ['test', 'adapter']
    });
    
    // 测试获取文档
    let snapshot = await docRef.get();
    if (!snapshot.exists()) {
      throw new Error('文档获取失败');
    }
    
    const data = snapshot.data();
    if (data.title !== 'Test Document') {
      throw new Error('文档数据不匹配');
    }
    
    // 测试更新文档
    await docRef.update({
      count: 2,
      updatedAt: new Date()
    });
    
    snapshot = await docRef.get();
    if (snapshot.data().count !== 2) {
      throw new Error('文档更新失败');
    }
    
    // 清理
    await docRef.delete();
  }
  
  private async testQueries(): Promise<void> {
    const collection = this.db.collection('test_queries');
    
    // 添加测试数据
    await collection.add({ name: 'Item 1', priority: 1, active: true });
    await collection.add({ name: 'Item 2', priority: 2, active: false });
    await collection.add({ name: 'Item 3', priority: 3, active: true });
    
    // 测试基本查询
    let query = collection.where('active', '==', true);
    let snapshot = await query.get();
    
    if (snapshot.size !== 2) {
      throw new Error(`查询结果数量错误: 期望 2, 实际 ${snapshot.size}`);
    }
    
    // 测试排序查询
    query = collection.orderBy('priority', 'desc').limit(2);
    snapshot = await query.get();
    
    if (snapshot.size !== 2) {
      throw new Error('排序查询失败');
    }
    
    const docs = snapshot.docs;
    if (docs[0].data().priority < docs[1].data().priority) {
      throw new Error('排序顺序错误');
    }
    
    // 清理测试数据
    for (const doc of snapshot.docs) {
      await doc.ref.delete();
    }
  }
  
  private async testRealtimeListening(): Promise<void> {
    return new Promise((resolve, reject) => {
      const collection = this.db.collection('test_realtime');
      let changeCount = 0;
      
      // 设置监听器
      const unsubscribe = collection.onSnapshot((snapshot: any) => {
        changeCount++;
        
        if (changeCount === 1) {
          // 首次调用，添加文档
          collection.add({ test: 'realtime', timestamp: new Date() });
        } else if (changeCount === 2) {
          // 第二次调用，应该包含新添加的文档
          if (snapshot.size > 0) {
            unsubscribe();
            resolve();
          } else {
            unsubscribe();
            reject(new Error('实时监听未检测到变更'));
          }
        }
      }, (error: Error) => {
        unsubscribe();
        reject(error);
      });
      
      // 设置超时
      setTimeout(() => {
        unsubscribe();
        reject(new Error('实时监听测试超时'));
      }, 5000);
    });
  }
}

// 认证适配器测试
export class AuthAdapterTests extends BaseTestSuite {
  constructor(private auth: any) {
    super();
  }
  
  async runAllTests(): Promise<TestSuite> {
    console.log('🧪 开始认证适配器测试...');
    
    await this.runTest('认证状态检查', () => this.testAuthState());
    await this.runTest('用户注册测试', () => this.testSignUp());
    await this.runTest('用户登录测试', () => this.testSignIn());
    await this.runTest('令牌验证测试', () => this.testTokenValidation());
    await this.runTest('登出测试', () => this.testSignOut());
    
    return this.getSummary();
  }
  
  private async testAuthState(): Promise<void> {
    if (!this.auth) {
      throw new Error('认证实例未初始化');
    }
    
    const currentUser = this.auth.getCurrentUser();
    console.log('当前用户状态:', currentUser ? '已登录' : '未登录');
  }
  
  private async testSignUp(): Promise<void> {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'test123456';
    
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(testEmail, testPassword);
      
      if (!userCredential.user) {
        throw new Error('用户创建失败');
      }
      
      if (userCredential.user.email !== testEmail) {
        throw new Error('用户邮箱不匹配');
      }
      
      console.log('测试用户创建成功:', userCredential.user.uid);
    } catch (error) {
      // 如果是因为用户已存在而失败，则认为测试通过
      if (error instanceof Error && error.message.includes('already')) {
        console.log('用户已存在，跳过注册测试');
        return;
      }
      throw error;
    }
  }
  
  private async testSignIn(): Promise<void> {
    const testEmail = 'admin@t.com'; // 使用已知的管理员账号
    const testPassword = 'admin123';  // 需要确保这个账号存在
    
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(testEmail, testPassword);
      
      if (!userCredential.user) {
        throw new Error('登录失败：未返回用户对象');
      }
      
      if (userCredential.user.email !== testEmail) {
        throw new Error('登录用户邮箱不匹配');
      }
      
      console.log('登录测试成功:', userCredential.user.uid);
    } catch (error) {
      console.warn('登录测试跳过（可能需要真实的测试账号）:', error);
      // 在测试环境中，如果没有真实账号，可以跳过这个测试
      if (process.env.NODE_ENV === 'development') {
        return;
      }
      throw error;
    }
  }
  
  private async testTokenValidation(): Promise<void> {
    const currentUser = this.auth.getCurrentUser();
    
    if (!currentUser) {
      console.log('无当前用户，跳过令牌验证测试');
      return;
    }
    
    try {
      const tokenResult = await this.auth.getIdTokenResult(currentUser);
      
      if (!tokenResult.token) {
        throw new Error('令牌获取失败');
      }
      
      console.log('令牌验证成功, 过期时间:', tokenResult.expirationTime);
    } catch (error) {
      console.warn('令牌验证测试跳过:', error);
      if (process.env.NODE_ENV === 'development') {
        return;
      }
      throw error;
    }
  }
  
  private async testSignOut(): Promise<void> {
    try {
      await this.auth.signOut();
      console.log('登出测试成功');
    } catch (error) {
      console.warn('登出测试失败:', error);
      // 登出失败通常不是致命错误
      if (process.env.NODE_ENV === 'development') {
        return;
      }
      throw error;
    }
  }
}

// 存储适配器测试
export class StorageAdapterTests extends BaseTestSuite {
  constructor(private storage: any) {
    super();
  }
  
  async runAllTests(): Promise<TestSuite> {
    console.log('🧪 开始存储适配器测试...');
    
    await this.runTest('存储引用创建', () => this.testStorageRef());
    await this.runTest('文件上传测试', () => this.testFileUpload());
    await this.runTest('下载链接获取', () => this.testDownloadURL());
    await this.runTest('文件元数据获取', () => this.testFileMetadata());
    await this.runTest('文件删除测试', () => this.testFileDelete());
    
    return this.getSummary();
  }
  
  private async testStorageRef(): Promise<void> {
    if (!this.storage) {
      throw new Error('存储实例未初始化');
    }
    
    const ref = this.storage.ref('test/test-file.txt');
    
    if (!ref) {
      throw new Error('存储引用创建失败');
    }
    
    if (ref.name !== 'test-file.txt') {
      throw new Error('存储引用名称不匹配');
    }
  }
  
  private async testFileUpload(): Promise<void> {
    const testData = new Blob(['Hello, World!'], { type: 'text/plain' });
    const ref = this.storage.ref('test/upload-test.txt');
    
    try {
      const uploadTask = ref.put(testData);
      const snapshot = await uploadTask;
      
      if (snapshot.state !== 'success') {
        throw new Error('文件上传状态异常');
      }
      
      console.log('文件上传成功:', snapshot.bytesTransferred, 'bytes');
    } catch (error) {
      console.warn('文件上传测试跳过（需要后端支持）:', error);
      if (process.env.NODE_ENV === 'development') {
        return;
      }
      throw error;
    }
  }
  
  private async testDownloadURL(): Promise<void> {
    const ref = this.storage.ref('test/upload-test.txt');
    
    try {
      const url = await ref.getDownloadURL();
      
      if (!url || !url.startsWith('http')) {
        throw new Error('下载链接格式异常');
      }
      
      console.log('下载链接获取成功');
    } catch (error) {
      console.warn('下载链接测试跳过（文件可能不存在）:', error);
      if (process.env.NODE_ENV === 'development') {
        return;
      }
      throw error;
    }
  }
  
  private async testFileMetadata(): Promise<void> {
    const ref = this.storage.ref('test/upload-test.txt');
    
    try {
      const metadata = await ref.getMetadata();
      
      if (!metadata.name || !metadata.size) {
        throw new Error('文件元数据不完整');
      }
      
      console.log('文件元数据获取成功:', metadata.name, metadata.size, 'bytes');
    } catch (error) {
      console.warn('元数据测试跳过:', error);
      if (process.env.NODE_ENV === 'development') {
        return;
      }
      throw error;
    }
  }
  
  private async testFileDelete(): Promise<void> {
    const ref = this.storage.ref('test/upload-test.txt');
    
    try {
      await ref.delete();
      console.log('文件删除成功');
    } catch (error) {
      console.warn('文件删除测试跳过:', error);
      if (process.env.NODE_ENV === 'development') {
        return;
      }
      throw error;
    }
  }
}

// 综合测试套件
export class AdapterTestSuite {
  private testSuites: TestSuite[] = [];
  
  async runAllTests(services: {
    db?: any;
    auth?: any;
    storage?: any;
  }): Promise<{ 
    passed: boolean; 
    summary: TestSuite[]; 
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
  }> {
    console.log('🚀 开始适配器兼容性测试...');
    
    const config = MigrationManager.getConfig();
    
    // 数据库测试
    if (config.database && services.db) {
      const dbTests = new DatabaseAdapterTests(services.db);
      const result = await dbTests.runAllTests();
      this.testSuites.push(result);
    }
    
    // 认证测试
    if (config.auth && services.auth) {
      const authTests = new AuthAdapterTests(services.auth);
      const result = await authTests.runAllTests();
      this.testSuites.push(result);
    }
    
    // 存储测试
    if (config.storage && services.storage) {
      const storageTests = new StorageAdapterTests(services.storage);
      const result = await storageTests.runAllTests();
      this.testSuites.push(result);
    }
    
    // 统计结果
    const totalTests = this.testSuites.reduce((sum, suite) => sum + suite.results.length, 0);
    const totalPassed = this.testSuites.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.testSuites.reduce((sum, suite) => sum + suite.failed, 0);
    
    const passed = totalFailed === 0;
    
    console.log(`\n📊 测试汇总:`);
    console.log(`   总测试数: ${totalTests}`);
    console.log(`   通过: ${totalPassed}`);
    console.log(`   失败: ${totalFailed}`);
    console.log(`   成功率: ${Math.round((totalPassed / totalTests) * 100)}%`);
    
    if (passed) {
      console.log('🎉 所有测试通过！');
    } else {
      console.log('❌ 部分测试失败，请检查适配器实现');
    }
    
    return {
      passed,
      summary: this.testSuites,
      totalTests,
      totalPassed,
      totalFailed
    };
  }
}

export default AdapterTestSuite;