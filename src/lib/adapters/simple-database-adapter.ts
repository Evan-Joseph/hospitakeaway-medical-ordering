// src/lib/adapters/simple-database-adapter.ts
/**
 * 简化的数据库适配器 - 专为解决启动问题而设计
 * 使用模拟数据和本地存储，无需 MongoDB 客户端依赖
 */

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

// 模拟 serverTimestamp
export const serverTimestamp = () => new Timestamp();

// 文档快照适配器
export class DocumentSnapshot {
  constructor(
    private _id: string,
    private _data: any,
    private _exists: boolean = true
  ) {}
  
  get id(): string {
    return this._id;
  }
  
  exists(): boolean {
    return this._exists;
  }
  
  data(): any {
    if (!this._exists) return undefined;
    return this._data;
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

// 文档引用适配器
export class DocumentReference {
  constructor(
    private collectionName: string,
    private docId: string
  ) {}
  
  get id(): string {
    return this.docId;
  }
  
  async get(): Promise<DocumentSnapshot> {
    // 模拟从本地存储或API获取数据
    console.log(`🔥 Mock: Getting document ${this.collectionName}/${this.docId}`);
    return new DocumentSnapshot(this.docId, null, false);
  }
  
  async set(data: any): Promise<void> {
    console.log(`🔥 Mock: Setting document ${this.collectionName}/${this.docId}:`, data);
  }
  
  async update(data: any): Promise<void> {
    console.log(`🔥 Mock: Updating document ${this.collectionName}/${this.docId}:`, data);
  }
  
  async delete(): Promise<void> {
    console.log(`🔥 Mock: Deleting document ${this.collectionName}/${this.docId}`);
  }
}

// 查询构建器适配器
export class Query {
  constructor(
    private collectionName: string,
    private filters: any = {},
    private sortOptions: any = {},
    private limitCount?: number
  ) {}
  
  where(field: string, operator: string, value: any): Query {
    console.log(`🔥 Mock: Adding where clause ${field} ${operator} ${value}`);
    return new Query(this.collectionName, { ...this.filters, [field]: value }, this.sortOptions, this.limitCount);
  }
  
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): Query {
    console.log(`🔥 Mock: Adding orderBy ${field} ${direction}`);
    return new Query(this.collectionName, this.filters, { ...this.sortOptions, [field]: direction }, this.limitCount);
  }
  
  limit(limit: number): Query {
    console.log(`🔥 Mock: Adding limit ${limit}`);
    return new Query(this.collectionName, this.filters, this.sortOptions, limit);
  }
  
  async get(): Promise<QuerySnapshot> {
    console.log(`🔥 Mock: Executing query on ${this.collectionName}`);
    return new QuerySnapshot([]);
  }
  
  onSnapshot(
    onNext: (snapshot: QuerySnapshot) => void,
    onError?: (error: Error) => void
  ): () => void {
    console.log(`🔥 Mock: Setting up snapshot listener for ${this.collectionName}`);
    
    // 立即返回空结果
    setTimeout(() => {
      onNext(new QuerySnapshot([]));
    }, 100);
    
    // 返回取消监听的函数
    return () => {
      console.log(`🔥 Mock: Unsubscribing from ${this.collectionName}`);
    };
  }
}

// 集合引用适配器
export class CollectionReference {
  constructor(private collectionName: string) {}
  
  doc(docId?: string): DocumentReference {
    const id = docId || this.generateId();
    return new DocumentReference(this.collectionName, id);
  }
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  async add(data: any): Promise<DocumentReference> {
    console.log(`🔥 Mock: Adding document to ${this.collectionName}:`, data);
    const id = this.generateId();
    return new DocumentReference(this.collectionName, id);
  }
  
  where(field: string, operator: string, value: any): Query {
    return new Query(this.collectionName).where(field, operator, value);
  }
  
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): Query {
    return new Query(this.collectionName).orderBy(field, direction);
  }
  
  limit(limit: number): Query {
    return new Query(this.collectionName).limit(limit);
  }
  
  async get(): Promise<QuerySnapshot> {
    return new Query(this.collectionName).get();
  }
  
  onSnapshot(
    onNext: (snapshot: QuerySnapshot) => void,
    onError?: (error: Error) => void
  ): () => void {
    return new Query(this.collectionName).onSnapshot(onNext, onError);
  }
}

// 简化的数据库适配器类
export class SimpleDatabaseAdapter {
  constructor(connectionString?: string, databaseName?: string) {
    console.log('🚀 简化数据库适配器已初始化 - 使用模拟数据');
  }
  
  async connect(): Promise<void> {
    console.log('✅ 模拟数据库连接已建立');
  }
  
  async disconnect(): Promise<void> {
    console.log('✅ 模拟数据库连接已断开');
  }
  
  collection(name: string): CollectionReference {
    return new CollectionReference(name);
  }
  
  doc(path: string): DocumentReference {
    const pathParts = path.split('/');
    if (pathParts.length !== 2) {
      throw new Error('Invalid document path. Expected format: "collection/document"');
    }
    
    const [collectionName, docId] = pathParts;
    return new DocumentReference(collectionName, docId);
  }
  
  serverTimestamp(): Date {
    return new Date();
  }
}

// 导出兼容 Firebase 的函数
export const collection = (db: SimpleDatabaseAdapter, name: string): CollectionReference => {
  return db.collection(name);
};

export const doc = (db: SimpleDatabaseAdapter, path: string): DocumentReference => {
  return db.doc(path);
};

export const query = (
  collection: CollectionReference,
  ...constraints: any[]
): Query => {
  let currentQuery = new Query((collection as any).collectionName);
  
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

export default SimpleDatabaseAdapter;