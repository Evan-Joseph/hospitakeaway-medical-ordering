/**
 * Firebase 兼容适配器 - 桥接到新服务
 * 
 * 此文件提供与 Firebase 完全兼容的接口，但内部路由到新的适配器系统
 * 这样现有代码无需修改即可工作，支持渐进式迁移
 */

import { getMigrationConfig } from './migration-config';
import { 
  getDatabase, 
  getAuthentication, 
  getStorageAdapter,
  initializeAdapters 
} from './adapters';

// 检查迁移状态
const migrationConfig = getMigrationConfig();

// 初始化适配器
try {
  // 检查环境变量配置
  const config = {
    mongodb: {
      connectionString: process.env.MONGODB_URI || 'mongodb://admin:Hospital123!@localhost:27017/hospitakeaway?authSource=admin',
      databaseName: process.env.MONGODB_DB_NAME || 'hospitakeaway'
    },
    auth: {
      apiBaseUrl: process.env.AUTH_API_URL || 'http://localhost:3000'
    },
    storage: {
      apiBaseUrl: process.env.STORAGE_API_URL || 'http://localhost:3000',
      defaultBucket: process.env.OSS_BUCKET || 'hospitakeaway-storage'
    },
    realtime: {
      wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
    },
    enableNewServices: migrationConfig
  };
  
  initializeAdapters(config);
} catch (error) {
  console.error('⚠️ 适配器初始化失败:', error);
}

/**
 * 数据库适配器 - 兼容 Firestore 接口
 */
export const db = getDatabase();

/**
 * 认证适配器 - 兼容 Firebase Auth 接口  
 */
export const auth = getAuthentication();

/**
 * 存储适配器 - 兼容 Firebase Storage 接口
 */
export const storage = getStorageAdapter();

/**
 * 应用实例 - 兼容性占位符
 */
export const app = {
  name: 'hospitakeaway-app',
  options: {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'hospitakeaway-local'
  }
};

// 导出迁移状态信息
export const migrationStatus = {
  database: migrationConfig.database,
  auth: migrationConfig.auth,
  storage: migrationConfig.storage,
  realtime: migrationConfig.realtime
};

// 兼容性检查函数
export const checkCompatibility = () => {
  console.log('🔄 Firebase 兼容适配器已加载');
  console.log('📊 迁移状态:', migrationStatus);
  
  if (migrationStatus.database && migrationStatus.auth && migrationStatus.storage) {
    console.log('✅ 已完全迁移到新服务');
  } else {
    console.log('⚠️  部分服务仍使用 Firebase');
  }
};

// 在开发环境下显示迁移状态
if (process.env.NODE_ENV === 'development') {
  checkCompatibility();
}

export default {
  db,
  auth,
  storage,
  app,
  migrationStatus,
  checkCompatibility
};
