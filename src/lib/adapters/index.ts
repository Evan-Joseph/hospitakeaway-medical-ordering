// src/lib/adapters/index.ts
/**
 * 适配器统一入口文件
 * 提供与 Firebase 完全兼容的接口，但底层使用 MongoDB + JWT + OSS + WebSocket
 */

import DatabaseAdapter, {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  type DocumentSnapshot,
  type QuerySnapshot,
  type DocumentReference,
  type CollectionReference,
  type Query
} from './database-adapter';

import AuthAdapter, {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getIdTokenResult,
  type User,
  type AuthError,
  type UserCredential,
  type IdTokenResult
} from './auth-adapter';

import StorageAdapter, {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  uploadString,
  getDownloadURL,
  getMetadata,
  deleteObject,
  type StorageReference,
  type UploadTask,
  type UploadTaskSnapshot,
  type UploadMetadata,
  type FullMetadata,
  type StorageError
} from './storage-adapter';

import RealtimeAdapter, { getRealtimeAdapter } from './realtime-adapter';

// 环境配置
interface AdapterConfig {
  mongodb: {
    connectionString: string;
    databaseName: string;
  };
  auth: {
    apiBaseUrl: string;
  };
  storage: {
    apiBaseUrl: string;
    defaultBucket: string;
  };
  realtime: {
    wsUrl: string;
  };
  enableNewServices: {
    auth: boolean;
    database: boolean;
    storage: boolean;
    realtime: boolean;
  };
}

// 全局配置
let config: AdapterConfig;

// 全局实例
let dbInstance: DatabaseAdapter | null = null;
let authInstance: AuthAdapter | null = null;
let storageInstance: StorageAdapter | null = null;
let realtimeInstance: RealtimeAdapter | null = null;

// 初始化适配器
export const initializeAdapters = async (adapterConfig: AdapterConfig): Promise<void> => {
  config = adapterConfig;
  
  // 初始化数据库适配器
  if (config.enableNewServices.database) {
    dbInstance = new DatabaseAdapter(
      config.mongodb.connectionString,
      config.mongodb.databaseName
    );
    await dbInstance.connect();
    console.log('✅ 数据库适配器已初始化');
  }
  
  // 初始化认证适配器
  if (config.enableNewServices.auth) {
    authInstance = new AuthAdapter(config.auth.apiBaseUrl);
    console.log('✅ 认证适配器已初始化');
  }
  
  // 初始化存储适配器
  if (config.enableNewServices.storage) {
    storageInstance = new StorageAdapter(
      config.storage.apiBaseUrl,
      config.storage.defaultBucket
    );
    console.log('✅ 存储适配器已初始化');
  }
  
  // 初始化实时适配器
  if (config.enableNewServices.realtime) {
    realtimeInstance = new RealtimeAdapter(config.realtime.wsUrl);
    console.log('✅ 实时适配器已初始化');
  }
};

// 获取数据库实例
export const getDatabase = (): DatabaseAdapter => {
  if (!dbInstance) {
    throw new Error('数据库适配器未初始化，请先调用 initializeAdapters()');
  }
  return dbInstance;
};

// 获取认证实例
export const getAuthentication = (): AuthAdapter => {
  if (!authInstance) {
    throw new Error('认证适配器未初始化，请先调用 initializeAdapters()');
  }
  return authInstance;
};

// 获取存储实例
export const getStorageAdapter = (): StorageAdapter => {
  if (!storageInstance) {
    throw new Error('存储适配器未初始化，请先调用 initializeAdapters()');
  }
  return storageInstance;
};

// 获取实时适配器实例
export const getRealtime = (): RealtimeAdapter => {
  if (!realtimeInstance) {
    throw new Error('实时适配器未初始化，请先调用 initializeAdapters()');
  }
  return realtimeInstance;
};

// 扩展 Query 类以支持实时监听
class QueryWithRealtime extends (Query as any) {
  onSnapshot(
    onNext: (snapshot: QuerySnapshot) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (config.enableNewServices.realtime && realtimeInstance) {
      // 使用 WebSocket 实时监听
      return realtimeInstance.onCollectionSnapshot(
        (this as any).collection.collectionName,
        (this as any).filter,
        onNext,
        onError
      );
    } else {
      // 使用原始的 MongoDB Change Streams
      return super.onSnapshot(onNext, onError);
    }
  }
}

// 扩展 DocumentReference 类以支持实时监听
class DocumentReferenceWithRealtime extends (DocumentReference as any) {
  onSnapshot(
    onNext: (snapshot: DocumentSnapshot) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (config.enableNewServices.realtime && realtimeInstance) {
      // 使用 WebSocket 实时监听
      return realtimeInstance.onDocumentSnapshot(
        (this as any).collection.collectionName,
        (this as any).docId,
        onNext,
        onError
      );
    } else {
      // 使用轮询或其他方式
      console.warn('实时适配器未启用，使用轮询方式监听文档变更');
      const pollInterval = setInterval(async () => {
        try {
          const snapshot = await this.get();
          onNext(snapshot);
        } catch (error) {
          if (onError) onError(error as Error);
        }
      }, 1000);
      
      return () => clearInterval(pollInterval);
    }
  }
}

// 导出兼容 Firebase 的接口
export {
  // 数据库相关
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  
  // 认证相关
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getIdTokenResult,
  
  // 存储相关
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  uploadString,
  getDownloadURL,
  getMetadata,
  deleteObject,
  
  // 类型导出
  type User,
  type AuthError,
  type UserCredential,
  type IdTokenResult,
  type DocumentSnapshot,
  type QuerySnapshot,
  type DocumentReference,
  type CollectionReference,
  type Query,
  type StorageReference,
  type UploadTask,
  type UploadTaskSnapshot,
  type UploadMetadata,
  type FullMetadata,
  type StorageError
};

// 默认导出适配器配置
export type { AdapterConfig };
export default {
  initializeAdapters,
  getDatabase,
  getAuthentication,
  getStorageAdapter,
  getRealtime
};