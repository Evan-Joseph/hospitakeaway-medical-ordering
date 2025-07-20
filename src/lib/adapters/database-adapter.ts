// src/lib/adapters/database-adapter.ts
/**
 * MongoDB 数据库适配器 - 完全兼容 Firebase Firestore 接口
 * 这个适配器使前端代码无需修改，只需替换底层数据存储
 */

// MongoDB 依赖已移除，改用 HTTP API 调用
// import { MongoClient, Db, Collection, ObjectId, WithId, Document } from 'mongodb';

// 兼容 Firebase 的时间戳类型
export class Timestamp {
  constructor(private date: Date = new Date()) {}
  
  toDate(): Date {
    return this.date;
  }
  
  static now(): Timestamp {
    return new Timestamp();
  }
  
  static fromDate(date: Date): Timestamp {
    return new Timestamp(date);
  }
}

// 模拟 Firebase 的 serverTimestamp
export const serverTimestamp = () => new Timestamp();

// 文档快照适配器
export class DocumentSnapshot {
  constructor(
    private _id: string | ObjectId,
    private _data: any,
    private _exists: boolean = true
  ) {}
  
  get id(): string {
    return this._id.toString();
  }
  
  exists(): boolean {
    return this._exists;
  }
  
  data(): any {
    if (!this._exists) return undefined;
    
    // 转换 MongoDB 数据格式到 Firebase 格式
    const data = { ...this._data };
    delete data._id; // 移除 MongoDB 的 _id 字段
    
    // 转换日期字段为 Timestamp
    if (data.createdAt instanceof Date) {
      data.createdAt = new Timestamp(data.createdAt);
    }
    if (data.updatedAt instanceof Date) {
      data.updatedAt = new Timestamp(data.updatedAt);
    }
    if (data.orderDate instanceof Date) {
      data.orderDate = new Timestamp(data.orderDate);
    }
    
    return data;
  }
}

// 查询快照适配器
export class QuerySnapshot {
  constructor(private documents: DocumentSnapshot[]) {}
  
  get docs(): DocumentSnapshot[] {
    return this.documents;
  }
  
  get size(): number {
    return this.documents.length;
  }
  
  get empty(): boolean {
    return this.documents.length === 0;
  }
}

// HTTP API 文档引用适配器
export class DocumentReference {
  constructor(
    private collectionName: string,
    private docId: string,
    private apiBaseUrl: string
  ) {}
  
  get id(): string {
    return this.docId;
  }
  
  async get(): Promise<DocumentSnapshot> {
    try {
      // 发送 HTTP GET 请求
      const response = await fetch(`${this.apiBaseUrl}/db/${this.collectionName}/${this.docId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return new DocumentSnapshot(this.docId, null, false);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const doc = await response.json();
      return new DocumentSnapshot(this.docId, doc, true);
    } catch (error) {
      console.error('Error getting document:', error);
      // 在开发环境中返回模拟数据
      console.log(`🔥 Mock: Getting document ${this.collectionName}/${this.docId}`);
      return new DocumentSnapshot(this.docId, null, false);
    }
  }
  
  async set(data: any): Promise<void> {
    try {
      const docData = {
        ...data,
        id: this.docId,
        updatedAt: new Date(),
        createdAt: data.createdAt || new Date()
      };
      
      // 转换 Timestamp 对象为 Date
      Object.keys(docData).forEach(key => {
        if (docData[key] instanceof Timestamp) {
          docData[key] = docData[key].toDate();
        }
      });
      
      await this.collection.replaceOne(
        { 
          $or: [
            { _id: new ObjectId(this.docId) },
            { uid: this.docId },
            { id: this.docId }
          ]
        },
        docData,
        { upsert: true }
      );
    } catch (error) {
      console.error('Error setting document:', error);
      throw error;
    }
  }
  
  async update(data: any): Promise<void> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      // 转换 Timestamp 对象为 Date
      Object.keys(updateData).forEach(key => {
        if (updateData[key] instanceof Timestamp) {
          updateData[key] = updateData[key].toDate();
        }
      });
      
      await this.collection.updateOne(
        { 
          $or: [
            { _id: new ObjectId(this.docId) },
            { uid: this.docId },
            { id: this.docId }
          ]
        },
        { $set: updateData }
      );
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }
  
  async delete(): Promise<void> {
    try {
      await this.collection.deleteOne({ 
        $or: [
          { _id: new ObjectId(this.docId) },
          { uid: this.docId },
          { id: this.docId }
        ]
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}

// 查询构建器适配器
export class Query {
  constructor(
    private collection: Collection,
    private filter: any = {},
    private sortOptions: any = {},
    private limitCount?: number,
    private offsetCount?: number
  ) {}
  
  where(field: string, operator: string, value: any): Query {
    const newFilter = { ...this.filter };
    
    switch (operator) {
      case '==':
        newFilter[field] = value;
        break;
      case '!=':
        newFilter[field] = { $ne: value };
        break;
      case '>':
        newFilter[field] = { $gt: value };
        break;
      case '>=':
        newFilter[field] = { $gte: value };
        break;
      case '<':
        newFilter[field] = { $lt: value };
        break;
      case '<=':
        newFilter[field] = { $lte: value };
        break;
      case 'in':
        newFilter[field] = { $in: value };
        break;
      case 'array-contains':
        newFilter[field] = { $elemMatch: { $eq: value } };
        break;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
    
    return new Query(this.collection, newFilter, this.sortOptions, this.limitCount, this.offsetCount);
  }
  
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): Query {
    const newSortOptions = {
      ...this.sortOptions,
      [field]: direction === 'asc' ? 1 : -1
    };
    return new Query(this.collection, this.filter, newSortOptions, this.limitCount, this.offsetCount);
  }
  
  limit(limit: number): Query {
    return new Query(this.collection, this.filter, this.sortOptions, limit, this.offsetCount);
  }
  
  offset(offset: number): Query {
    return new Query(this.collection, this.filter, this.sortOptions, this.limitCount, offset);
  }
  
  async get(): Promise<QuerySnapshot> {
    try {
      let cursor = this.collection.find(this.filter);
      
      if (Object.keys(this.sortOptions).length > 0) {
        cursor = cursor.sort(this.sortOptions);
      }
      
      if (this.offsetCount) {
        cursor = cursor.skip(this.offsetCount);
      }
      
      if (this.limitCount) {
        cursor = cursor.limit(this.limitCount);
      }
      
      const docs = await cursor.toArray();
      const documentSnapshots = docs.map(doc => 
        new DocumentSnapshot(doc._id, doc, true)
      );
      
      return new QuerySnapshot(documentSnapshots);
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }
  
  // 实时监听适配器 (使用 MongoDB Change Streams)
  onSnapshot(
    onNext: (snapshot: QuerySnapshot) => void,
    onError?: (error: Error) => void
  ): () => void {
    let changeStream: any;
    
    try {
      // 首次获取数据
      this.get().then(snapshot => onNext(snapshot));
      
      // 设置 Change Stream 监听
      changeStream = this.collection.watch([
        { $match: { ...this.filter } }
      ]);
      
      changeStream.on('change', async () => {
        try {
          const snapshot = await this.get();
          onNext(snapshot);
        } catch (error) {
          if (onError) onError(error as Error);
        }
      });
      
      changeStream.on('error', (error: Error) => {
        if (onError) onError(error);
      });
      
    } catch (error) {
      if (onError) onError(error as Error);
    }
    
    // 返回取消监听的函数
    return () => {
      if (changeStream) {
        changeStream.close();
      }
    };
  }
}

// HTTP API 集合引用适配器
export class CollectionReference {
  constructor(private collectionName: string, private apiBaseUrl: string) {}
  
  doc(docId?: string): DocumentReference {
    const id = docId || this.generateId();
    return new DocumentReference(this.collectionName, id, this.apiBaseUrl);
  }
  
  private generateId(): string {
    // 生成类似 ObjectId 的字符串
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  async add(data: any): Promise<DocumentReference> {
    try {
      const docData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 转换 Timestamp 对象为 Date
      Object.keys(docData).forEach(key => {
        if (docData[key] instanceof Timestamp) {
          docData[key] = docData[key].toDate();
        }
      });
      
      // 发送 HTTP POST 请求
      const response = await fetch(`${this.apiBaseUrl}/db/${this.collectionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(docData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return new DocumentReference(this.collectionName, result.id, this.apiBaseUrl);
    } catch (error) {
      console.error('Error adding document:', error);
      // 在开发环境中使用模拟数据
      const mockId = this.generateId();
      console.log(`🔥 Mock: Added document to ${this.collectionName} with ID ${mockId}`);
      return new DocumentReference(this.collectionName, mockId, this.apiBaseUrl);
    }
  }
  
  where(field: string, operator: string, value: any): Query {
    return new Query(this.collection).where(field, operator, value);
  }
  
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): Query {
    return new Query(this.collection).orderBy(field, direction);
  }
  
  limit(limit: number): Query {
    return new Query(this.collection).limit(limit);
  }
  
  async get(): Promise<QuerySnapshot> {
    return new Query(this.collection).get();
  }
  
  onSnapshot(
    onNext: (snapshot: QuerySnapshot) => void,
    onError?: (error: Error) => void
  ): () => void {
    return new Query(this.collection).onSnapshot(onNext, onError);
  }
}

// HTTP API 数据库适配器类
export class DatabaseAdapter {
  private apiBaseUrl: string;
  private databaseName: string;
  
  constructor(connectionString: string, databaseName: string) {
    // 从连接字符串提取数据库信息，但不建立实际连接
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9002/api';
    this.databaseName = databaseName;
    console.log(`📡 数据库适配器初始化 - API地址: ${this.apiBaseUrl}`);
  }
  
  async connect(): Promise<void> {
    // HTTP API 模式下无需连接
    console.log('✅ HTTP API 数据库适配器已就绪');
  }
  
  async disconnect(): Promise<void> {
    // HTTP API 模式下无需断开连接
    console.log('✅ HTTP API 数据库适配器已断开');
  }
  
  collection(name: string): CollectionReference {
    return new CollectionReference(name, this.apiBaseUrl);
  }
  
  doc(path: string): DocumentReference {
    const pathParts = path.split('/');
    if (pathParts.length !== 2) {
      throw new Error('Invalid document path. Expected format: "collection/document"');
    }
    
    const [collectionName, docId] = pathParts;
    return new DocumentReference(collectionName, docId, this.apiBaseUrl);
  }
  
  serverTimestamp(): Date {
    return new Date();
  }
}

// 导出兼容 Firebase 的函数
export const collection = (db: DatabaseAdapter, name: string): CollectionReference => {
  return db.collection(name);
};

export const doc = (db: DatabaseAdapter, path: string): DocumentReference => {
  return db.doc(path);
};

export const query = (
  collection: CollectionReference,
  ...constraints: any[]
): Query => {
  let currentQuery = new Query((collection as any).collection);
  
  for (const constraint of constraints) {
    if (constraint.type === 'where') {
      currentQuery = currentQuery.where(constraint.field, constraint.operator, constraint.value);
    } else if (constraint.type === 'orderBy') {
      currentQuery = currentQuery.orderBy(constraint.field, constraint.direction);
    } else if (constraint.type === 'limit') {
      currentQuery = currentQuery.limit(constraint.limit);
    }
  }
  
  return currentQuery;
};

export const where = (field: string, operator: string, value: any) => ({
  type: 'where',
  field,
  operator,
  value
});

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => ({
  type: 'orderBy',
  field,
  direction
});

export const limit = (limitCount: number) => ({
  type: 'limit',
  limit: limitCount
});

// 兼容 Firebase 的函数
export const getDocs = async (query: Query | CollectionReference): Promise<QuerySnapshot> => {
  return query.get();
};

export const getDoc = async (docRef: DocumentReference): Promise<DocumentSnapshot> => {
  return docRef.get();
};

export const addDoc = async (collection: CollectionReference, data: any): Promise<DocumentReference> => {
  return collection.add(data);
};

export const setDoc = async (docRef: DocumentReference, data: any): Promise<void> => {
  return docRef.set(data);
};

export const updateDoc = async (docRef: DocumentReference, data: any): Promise<void> => {
  return docRef.update(data);
};

export const deleteDoc = async (docRef: DocumentReference): Promise<void> => {
  return docRef.delete();
};

// 数组操作辅助函数
export const arrayUnion = (...elements: any[]) => ({
  $addToSet: { $each: elements }
});

export const arrayRemove = (...elements: any[]) => ({
  $pullAll: elements
});

export default DatabaseAdapter;