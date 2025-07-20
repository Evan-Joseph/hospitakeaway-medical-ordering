// src/lib/database.ts
/**
 * 新数据库配置文件 - 可选择使用 Firebase 或新适配器
 * 通过环境变量控制使用哪种服务
 */

import {
  initializeAdapters,
  getDatabase,
  getAuthentication,
  getStorageAdapter,
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
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getIdTokenResult,
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  uploadString,
  getDownloadURL,
  getMetadata,
  deleteObject,
  type AdapterConfig
} from './adapters';

// Firebase 导入 (备用)
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { getAuth as getFirebaseAuth, type Auth } from "firebase/auth";
import { getStorage as getFirebaseStorage, type FirebaseStorage } from "firebase/storage";

// 特性开关配置
const USE_NEW_SERVICES = {
  auth: process.env.NEXT_PUBLIC_USE_NEW_AUTH === 'true',
  database: process.env.NEXT_PUBLIC_USE_NEW_DATABASE === 'true',
  storage: process.env.NEXT_PUBLIC_USE_NEW_STORAGE === 'true',
  realtime: process.env.NEXT_PUBLIC_USE_NEW_REALTIME === 'true'
};

console.log('🚀 服务配置:', USE_NEW_SERVICES);

// Firebase 配置 (备用)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDStQeC5TeQrlVnKG08llMQcuj0fNAVKyY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mediorder-9suf6.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mediorder-9suf6",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mediorder-9suf6.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "817473525117",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:817473525117:web:69c8ebe167c359b87e2814"
};

// 新服务配置
const adapterConfig: AdapterConfig = {
  mongodb: {
    connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    databaseName: process.env.MONGODB_DATABASE || 'hospitakeaway'
  },
  auth: {
    apiBaseUrl: process.env.NEXT_PUBLIC_AUTH_API_URL || '/api/auth'
  },
  storage: {
    apiBaseUrl: process.env.NEXT_PUBLIC_STORAGE_API_URL || '/api/storage',
    defaultBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'hospitakeaway-files'
  },
  realtime: {
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
  },
  enableNewServices: USE_NEW_SERVICES
};

// 全局变量
let app: FirebaseApp;
let db: any;
let auth: any;
let storage: any;
let initialized = false;

// 初始化服务
const initializeServices = async () => {
  if (initialized) return;
  
  try {
    if (USE_NEW_SERVICES.database || USE_NEW_SERVICES.auth || USE_NEW_SERVICES.storage) {
      // 初始化新适配器
      await initializeAdapters(adapterConfig);
      console.log('✅ 新适配器初始化完成');
      
      // 根据配置选择服务
      db = USE_NEW_SERVICES.database ? getDatabase() : initializeFirebaseFirestore();
      auth = USE_NEW_SERVICES.auth ? getAuthentication() : initializeFirebaseAuth();
      storage = USE_NEW_SERVICES.storage ? getStorageAdapter() : initializeFirebaseStorage();
    } else {
      // 使用 Firebase
      console.log('🔥 使用 Firebase 服务');
      db = initializeFirebaseFirestore();
      auth = initializeFirebaseAuth();
      storage = initializeFirebaseStorage();
    }
    
    initialized = true;
    console.log('🎉 服务初始化完成');
  } catch (error) {
    console.error('❌ 服务初始化失败:', error);
    throw error;
  }
};

// 初始化 Firebase Firestore
const initializeFirebaseFirestore = () => {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  return initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
};

// 初始化 Firebase Auth
const initializeFirebaseAuth = () => {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  return getFirebaseAuth(app);
};

// 初始化 Firebase Storage
const initializeFirebaseStorage = () => {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  return getFirebaseStorage(app);
};

// 确保服务已初始化的包装函数
const ensureInitialized = async () => {
  if (!initialized) {
    await initializeServices();
  }
};

// 导出服务实例 (延迟初始化)
export const getDB = async () => {
  await ensureInitialized();
  return db;
};

export const getAuthService = async () => {
  await ensureInitialized();
  return auth;
};

export const getStorageService = async () => {
  await ensureInitialized();
  return storage;
};

// 兼容原有导出方式 (同步)
export const dbPromise = getDB();
export const authPromise = getAuthService();
export const storagePromise = getStorageService();

// 立即初始化 (在客户端)
if (typeof window !== 'undefined') {
  initializeServices().catch(console.error);
}

// 直接导出 (保持向后兼容，但可能为 undefined)
export { db, auth, storage };

// 导出配置信息
export { USE_NEW_SERVICES, adapterConfig, firebaseConfig };

// 导出所有必要的函数和类型
export {
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
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getIdTokenResult,
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  uploadString,
  getDownloadURL,
  getMetadata,
  deleteObject
};

// 默认导出
export default {
  getDB,
  getAuthService,
  getStorageService,
  USE_NEW_SERVICES
};