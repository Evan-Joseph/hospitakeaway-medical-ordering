/**
 * Firebase 兼容适配器 - 桥接到新服务
 * 
 * 此文件提供与 Firebase 完全兼容的接口，但内部路由到新的适配器系统
 * 这样现有代码无需修改即可工作，支持渐进式迁移
 * 
 * 当前版本：使用模拟数据确保应用正常启动
 */

import { getMigrationConfig } from './migration-config';

// 检查迁移状态
const migrationConfig = getMigrationConfig();

// 简单的模拟数据库实现
const createMockDatabase = () => {
  console.log('🔥 创建模拟数据库适配器');
  
  return {
    collection: (name: string) => ({
      add: async (data: any) => {
        console.log(`🔥 Mock: 添加文档到 ${name}:`, data);
        return { 
          id: 'mock_doc_' + Date.now() + '_' + Math.random().toString(36).substr(2)
        };
      },
      doc: (id: string) => ({
        set: async (data: any) => {
          console.log(`🔥 Mock: 设置文档 ${name}/${id}:`, data);
        },
        update: async (data: any) => {
          console.log(`🔥 Mock: 更新文档 ${name}/${id}:`, data);
        },
        get: async () => ({
          exists: () => false,
          data: () => null,
          id
        }),
        delete: async () => {
          console.log(`🔥 Mock: 删除文档 ${name}/${id}`);
        }
      }),
      orderBy: (field: string, direction?: string) => ({
        get: async () => ({
          docs: [],
          size: 0,
          empty: true
        }),
        onSnapshot: (callback: any, errorCallback?: any) => {
          console.log(`🔥 Mock: 监听 ${name} 集合 orderBy ${field} ${direction}`);
          setTimeout(() => {
            callback({ docs: [], size: 0, empty: true });
          }, 100);
          return () => console.log(`🔥 Mock: 取消监听 ${name}`);
        }
      }),
      where: (field: string, operator: string, value: any) => ({
        get: async () => {
          console.log(`🔥 Mock: 查询 ${name} where ${field} ${operator} ${value}`);
          return {
            docs: [],
            size: 0,
            empty: true
          };
        },
        onSnapshot: (callback: any, errorCallback?: any) => {
          console.log(`🔥 Mock: 监听 ${name} 集合 where ${field} ${operator} ${value}`);
          setTimeout(() => {
            callback({ docs: [], size: 0, empty: true });
          }, 100);
          return () => console.log(`🔥 Mock: 取消监听 ${name}`);
        }
      }),
      get: async () => ({
        docs: [],
        size: 0,
        empty: true
      }),
      onSnapshot: (callback: any, errorCallback?: any) => {
        console.log(`🔥 Mock: 监听 ${name} 集合`);
        setTimeout(() => {
          callback({ docs: [], size: 0, empty: true });
        }, 100);
        return () => console.log(`🔥 Mock: 取消监听 ${name}`);
      }
    }),
    doc: (path: string) => {
      const [collectionName, docId] = path.split('/');
      return {
        set: async (data: any) => {
          console.log(`🔥 Mock: 设置文档 ${path}:`, data);
        },
        update: async (data: any) => {
          console.log(`🔥 Mock: 更新文档 ${path}:`, data);
        },
        get: async () => ({
          exists: () => false,
          data: () => null,
          id: docId
        }),
        delete: async () => {
          console.log(`🔥 Mock: 删除文档 ${path}`);
        }
      };
    },
    serverTimestamp: () => new Date()
  };
};

const createMockAuth = () => {
  console.log('🔐 创建模拟认证适配器');
  
  return {
    signInWithEmailAndPassword: async (email: string, password: string) => {
      console.log('🔥 Mock: 登录:', email);
      return {
        user: {
          uid: 'mock_user_' + Date.now(),
          email,
          displayName: 'Mock User'
        }
      };
    },
    createUserWithEmailAndPassword: async (email: string, password: string) => {
      console.log('🔥 Mock: 注册:', email);
      return {
        user: {
          uid: 'mock_user_' + Date.now(),
          email,
          displayName: 'Mock User'
        }
      };
    },
    signOut: async () => {
      console.log('🔥 Mock: 登出');
    },
    onAuthStateChanged: (callback: any) => {
      console.log('🔥 Mock: 认证状态监听');
      setTimeout(() => {
        callback(null); // 默认未登录
      }, 100);
      return () => console.log('🔥 Mock: 取消认证监听');
    }
  };
};

const createMockStorage = () => {
  console.log('📁 创建模拟存储适配器');
  
  return {
    ref: (path: string) => ({
      put: async (file: any) => {
        console.log(`🔥 Mock: 上传文件到 ${path}`);
        return {
          ref: {
            getDownloadURL: async () => `https://mock-storage.com/${path}`
          }
        };
      },
      getDownloadURL: async () => `https://mock-storage.com/${path}`,
      delete: async () => {
        console.log(`🔥 Mock: 删除文件 ${path}`);
      }
    })
  };
};

/**
 * 数据库适配器 - 兼容 Firestore 接口
 */
export const db = createMockDatabase();

/**
 * 认证适配器 - 兼容 Firebase Auth 接口  
 */
export const auth = createMockAuth();

/**
 * 存储适配器 - 兼容 Firebase Storage 接口
 */
export const storage = createMockStorage();

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
  console.log('🔄 Firebase 兼容适配器已加载 (模拟数据模式)');
  console.log('📊 迁移状态:', migrationStatus);
  
  if (migrationStatus.database && migrationStatus.auth && migrationStatus.storage) {
    console.log('✅ 已完全迁移到新服务 (当前使用模拟数据)');
  } else {
    console.log('⚠️ 部分服务仍使用 Firebase (当前使用模拟数据)');
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