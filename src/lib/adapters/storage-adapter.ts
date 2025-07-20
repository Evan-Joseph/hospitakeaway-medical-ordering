// src/lib/adapters/storage-adapter.ts
/**
 * 阿里云 OSS 存储适配器 - 完全兼容 Firebase Storage 接口
 * 这个适配器使前端代码无需修改，只需替换底层存储服务
 */

import { createOSSClient, generateOSSPath, FILE_CATEGORIES, type FileCategory } from '../oss-config';
import type OSS from 'ali-oss';

// 兼容 Firebase Storage 的类型定义
export interface StorageReference {
  bucket: string;
  name: string;
  fullPath: string;
  parent?: StorageReference;
  root: StorageReference;
}

export interface UploadMetadata {
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentLanguage?: string;
  contentType?: string;
  customMetadata?: { [key: string]: string };
}

export interface FullMetadata extends UploadMetadata {
  bucket: string;
  fullPath: string;
  generation: string;
  name: string;
  size: number;
  timeCreated: string;
  updated: string;
  md5Hash?: string;
}

export interface UploadTask {
  snapshot: UploadTaskSnapshot;
  on: (
    event: 'state_changed',
    nextOrObserver?: (snapshot: UploadTaskSnapshot) => void,
    error?: (error: StorageError) => void,
    complete?: () => void
  ) => () => void;
  then: (
    onFulfilled?: (snapshot: UploadTaskSnapshot) => any,
    onRejected?: (error: StorageError) => any
  ) => Promise<UploadTaskSnapshot>;
  catch: (onRejected: (error: StorageError) => any) => Promise<UploadTaskSnapshot>;
}

export interface UploadTaskSnapshot {
  bytesTransferred: number;
  totalBytes: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
  metadata: FullMetadata;
  ref: StorageReference;
  task: UploadTask;
}

export interface StorageError extends Error {
  code: string;
  serverResponse?: string;
}

// 上传进度回调类型
type ProgressCallback = (snapshot: UploadTaskSnapshot) => void;
type ErrorCallback = (error: StorageError) => void;
type CompleteCallback = () => void;

// 阿里云 OSS 上传响应接口
interface OSSUploadResponse {
  url: string;
  name: string;
  size: number;
  etag: string;
}

// 存储引用适配器类
export class StorageReferenceAdapter implements StorageReference {
  public bucket: string;
  public name: string;
  public fullPath: string;
  public parent?: StorageReference;
  public root: StorageReference;
  
  constructor(
    private storage: StorageAdapter,
    fullPath: string,
    bucket: string = 'default'
  ) {
    this.bucket = bucket;
    this.fullPath = fullPath;
    this.name = fullPath.split('/').pop() || '';
    
    // 设置父级引用
    const pathParts = fullPath.split('/').slice(0, -1);
    if (pathParts.length > 0) {
      this.parent = new StorageReferenceAdapter(storage, pathParts.join('/'), bucket);
    }
    
    // 设置根引用
    this.root = new StorageReferenceAdapter(storage, '', bucket);
  }
  
  // 子路径引用
  child(path: string): StorageReference {
    const newPath = this.fullPath ? `${this.fullPath}/${path}` : path;
    return new StorageReferenceAdapter(this.storage, newPath, this.bucket);
  }
  
  // 上传文件
  put(data: Blob | Uint8Array | ArrayBuffer, metadata?: UploadMetadata): UploadTask {
    return this.storage.uploadFile(this, data, metadata);
  }
  
  // 上传字符串
  putString(data: string, format: 'raw' | 'base64' | 'base64url' | 'data_url' = 'raw', metadata?: UploadMetadata): UploadTask {
    let processedData: Blob;
    
    switch (format) {
      case 'base64':
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        processedData = new Blob([bytes]);
        break;
      case 'data_url':
        const response = fetch(data);
        processedData = new Blob([response]);
        break;
      case 'raw':
      default:
        processedData = new Blob([data]);
        break;
    }
    
    return this.put(processedData, metadata);
  }
  
  // 获取下载 URL
  async getDownloadURL(): Promise<string> {
    try {
      const response = await fetch(`/api/storage/download-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.storage.getAccessToken()}`,
        },
        body: JSON.stringify({
          path: this.fullPath,
          bucket: this.bucket,
        }),
      });
      
      if (!response.ok) {
        throw this.createStorageError('storage/object-not-found', '文件不存在');
      }
      
      const result = await response.json();
      return result.url;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createStorageError('storage/unknown', '获取下载链接失败');
    }
  }
  
  // 获取文件元数据
  async getMetadata(): Promise<FullMetadata> {
    try {
      const response = await fetch(`/api/storage/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.storage.getAccessToken()}`,
        },
        body: JSON.stringify({
          path: this.fullPath,
          bucket: this.bucket,
        }),
      });
      
      if (!response.ok) {
        throw this.createStorageError('storage/object-not-found', '文件不存在');
      }
      
      const metadata = await response.json();
      return {
        bucket: this.bucket,
        fullPath: this.fullPath,
        generation: metadata.etag || '',
        name: this.name,
        size: metadata.size || 0,
        timeCreated: metadata.lastModified || new Date().toISOString(),
        updated: metadata.lastModified || new Date().toISOString(),
        contentType: metadata.contentType,
        md5Hash: metadata.md5Hash,
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createStorageError('storage/unknown', '获取文件元数据失败');
    }
  }
  
  // 删除文件
  async delete(): Promise<void> {
    try {
      const response = await fetch(`/api/storage/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.storage.getAccessToken()}`,
        },
        body: JSON.stringify({
          path: this.fullPath,
          bucket: this.bucket,
        }),
      });
      
      if (!response.ok) {
        throw this.createStorageError('storage/object-not-found', '文件删除失败');
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createStorageError('storage/unknown', '文件删除失败');
    }
  }
  
  private createStorageError(code: string, message: string): StorageError {
    const error = new Error(message) as StorageError;
    error.code = code;
    return error;
  }
}

// 上传任务适配器类
export class UploadTaskAdapter implements UploadTask {
  public snapshot: UploadTaskSnapshot;
  private progressCallbacks: ProgressCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private completeCallbacks: CompleteCallback[] = [];
  private xhr: XMLHttpRequest | null = null;
  
  constructor(
    private ref: StorageReference,
    private data: Blob | Uint8Array | ArrayBuffer,
    private metadata?: UploadMetadata
  ) {
    this.snapshot = {
      bytesTransferred: 0,
      totalBytes: data instanceof Blob ? data.size : data.byteLength,
      state: 'running',
      metadata: {
        bucket: ref.bucket,
        fullPath: ref.fullPath,
        generation: '',
        name: ref.name,
        size: data instanceof Blob ? data.size : data.byteLength,
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString(),
        contentType: metadata?.contentType || 'application/octet-stream',
      },
      ref: this.ref,
      task: this,
    };
    
    // 开始上传
    this.startUpload();
  }
  
  on(
    event: 'state_changed',
    nextOrObserver?: ProgressCallback,
    error?: ErrorCallback,
    complete?: CompleteCallback
  ): () => void {
    if (nextOrObserver) this.progressCallbacks.push(nextOrObserver);
    if (error) this.errorCallbacks.push(error);
    if (complete) this.completeCallbacks.push(complete);
    
    return () => {
      if (nextOrObserver) {
        this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== nextOrObserver);
      }
      if (error) {
        this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== error);
      }
      if (complete) {
        this.completeCallbacks = this.completeCallbacks.filter(cb => cb !== complete);
      }
    };
  }
  
  then(
    onFulfilled?: (snapshot: UploadTaskSnapshot) => any,
    onRejected?: (error: StorageError) => any
  ): Promise<UploadTaskSnapshot> {
    return new Promise((resolve, reject) => {
      if (this.snapshot.state === 'success') {
        resolve(onFulfilled ? onFulfilled(this.snapshot) : this.snapshot);
      } else if (this.snapshot.state === 'error') {
        reject(onRejected ? onRejected(this.createStorageError('storage/unknown', '上传失败')) : this.createStorageError('storage/unknown', '上传失败'));
      } else {
        this.completeCallbacks.push(() => {
          resolve(onFulfilled ? onFulfilled(this.snapshot) : this.snapshot);
        });
        this.errorCallbacks.push((error) => {
          reject(onRejected ? onRejected(error) : error);
        });
      }
    });
  }
  
  catch(onRejected: (error: StorageError) => any): Promise<UploadTaskSnapshot> {
    return this.then(undefined, onRejected);
  }
  
  private async startUpload(): Promise<void> {
    try {
      // 获取上传签名 URL
      const uploadUrlResponse = await fetch('/api/storage/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: this.ref.fullPath,
          contentType: this.metadata?.contentType || 'application/octet-stream',
          size: this.snapshot.totalBytes,
        }),
      });
      
      if (!uploadUrlResponse.ok) {
        throw new Error('获取上传URL失败');
      }
      
      const { uploadUrl, fields } = await uploadUrlResponse.json();
      
      // 创建表单数据
      const formData = new FormData();
      if (fields) {
        Object.keys(fields).forEach(key => {
          formData.append(key, fields[key]);
        });
      }
      formData.append('file', new Blob([this.data]), this.ref.name);
      
      // 创建 XMLHttpRequest 进行上传
      this.xhr = new XMLHttpRequest();
      
      // 上传进度监听
      this.xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          this.snapshot.bytesTransferred = event.loaded;
          this.snapshot.state = 'running';
          this.progressCallbacks.forEach(callback => callback(this.snapshot));
        }
      };
      
      // 上传完成监听
      this.xhr.onload = () => {
        if (this.xhr!.status >= 200 && this.xhr!.status < 300) {
          this.snapshot.state = 'success';
          this.snapshot.bytesTransferred = this.snapshot.totalBytes;
          this.completeCallbacks.forEach(callback => callback());
        } else {
          this.snapshot.state = 'error';
          const error = this.createStorageError('storage/unknown', '上传失败');
          this.errorCallbacks.forEach(callback => callback(error));
        }
      };
      
      // 上传错误监听
      this.xhr.onerror = () => {
        this.snapshot.state = 'error';
        const error = this.createStorageError('storage/unknown', '网络错误');
        this.errorCallbacks.forEach(callback => callback(error));
      };
      
      // 开始上传
      this.xhr.open('POST', uploadUrl);
      this.xhr.send(formData);
      
    } catch (error) {
      this.snapshot.state = 'error';
      const storageError = this.createStorageError('storage/unknown', '上传初始化失败');
      this.errorCallbacks.forEach(callback => callback(storageError));
    }
  }
  
  private createStorageError(code: string, message: string): StorageError {
    const error = new Error(message) as StorageError;
    error.code = code;
    return error;
  }
}

// 主存储适配器类
export class StorageAdapter {
  constructor(
    private apiBaseUrl: string = '/api/storage',
    private defaultBucket: string = 'default'
  ) {}
  
  // 获取存储引用
  ref(path?: string): StorageReference {
    return new StorageReferenceAdapter(this, path || '', this.defaultBucket);
  }
  
  // 从 URL 获取引用
  refFromURL(url: string): StorageReference {
    // 解析 URL 获取路径
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.substring(1); // 移除开头的 /
      return new StorageReferenceAdapter(this, path, this.defaultBucket);
    } catch (error) {
      throw this.createStorageError('storage/invalid-url', '无效的存储URL');
    }
  }
  
  // 上传文件
  uploadFile(
    ref: StorageReference,
    data: Blob | Uint8Array | ArrayBuffer,
    metadata?: UploadMetadata
  ): UploadTask {
    return new UploadTaskAdapter(ref, data, metadata);
  }
  
  // 获取访问令牌（用于 API 认证）
  getAccessToken(): string | null {
    return localStorage.getItem('auth_access_token');
  }
  
  private createStorageError(code: string, message: string): StorageError {
    const error = new Error(message) as StorageError;
    error.code = code;
    return error;
  }
}

// 创建全局存储实例
let storageInstance: StorageAdapter | null = null;

export const getStorage = (app?: any): StorageAdapter => {
  if (!storageInstance) {
    storageInstance = new StorageAdapter();
  }
  return storageInstance;
};

// 导出兼容 Firebase 的函数
export const ref = (storage: StorageAdapter, path?: string): StorageReference => {
  return storage.ref(path);
};

export const uploadBytes = (
  ref: StorageReference,
  data: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): Promise<UploadTaskSnapshot> => {
  return ref.put(data, metadata).then();
};

export const uploadBytesResumable = (
  ref: StorageReference,
  data: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): UploadTask => {
  return ref.put(data, metadata);
};

export const uploadString = (
  ref: StorageReference,
  data: string,
  format?: 'raw' | 'base64' | 'base64url' | 'data_url',
  metadata?: UploadMetadata
): Promise<UploadTaskSnapshot> => {
  return ref.putString(data, format, metadata).then();
};

export const getDownloadURL = (ref: StorageReference): Promise<string> => {
  return ref.getDownloadURL();
};

export const getMetadata = (ref: StorageReference): Promise<FullMetadata> => {
  return ref.getMetadata();
};

export const deleteObject = (ref: StorageReference): Promise<void> => {
  return ref.delete();
};

export default StorageAdapter;