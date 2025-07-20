// src/lib/adapters/realtime-adapter.ts
/**
 * WebSocket 实时数据同步适配器 - 替换 Firebase 实时监听
 * 提供与 Firebase onSnapshot 完全兼容的实时数据同步功能
 */

import { QuerySnapshot, DocumentSnapshot } from './database-adapter';

// WebSocket 消息类型
interface WSMessage {
  type: 'collection_change' | 'document_change' | 'error' | 'auth_required';
  collection?: string;
  documentId?: string;
  data?: any;
  error?: string;
  operation?: 'insert' | 'update' | 'delete';
}

// 订阅配置
interface SubscriptionConfig {
  collection: string;
  query?: any;
  documentId?: string;
}

// 监听器管理
interface Listener {
  id: string;
  config: SubscriptionConfig;
  onNext: (snapshot: QuerySnapshot | DocumentSnapshot) => void;
  onError?: (error: Error) => void;
}

export class RealtimeAdapter {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Listener> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private messageQueue: WSMessage[] = [];
  
  constructor(
    private wsUrl: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    private getAccessToken: () => string | null = () => localStorage.getItem('auth_access_token')
  ) {
    this.connect();
  }
  
  // 建立 WebSocket 连接
  private async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }
    
    this.isConnecting = true;
    
    try {
      const token = this.getAccessToken();
      const wsUrl = token ? `${this.wsUrl}?token=${encodeURIComponent(token)}` : this.wsUrl;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket 连接已建立');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // 发送队列中的消息
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          if (message) {
            this.sendMessage(message);
          }
        }
        
        // 重新订阅所有监听器
        this.listeners.forEach(listener => {
          this.subscribeToCollection(listener.config);
        });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('解析 WebSocket 消息失败:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket 连接已关闭:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        
        // 如果不是手动关闭，则尝试重连
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        this.isConnecting = false;
      };
      
    } catch (error) {
      console.error('WebSocket 连接失败:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }
  
  // 安排重连
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket 重连次数已达上限');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`${delay}ms 后尝试第 ${this.reconnectAttempts} 次重连...`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  // 发送消息
  private sendMessage(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // 将消息加入队列，等待连接建立后发送
      this.messageQueue.push(message);
      if (!this.isConnecting) {
        this.connect();
      }
    }
  }
  
  // 处理接收到的消息
  private handleMessage(message: WSMessage): void {
    switch (message.type) {
      case 'collection_change':
        this.handleCollectionChange(message);
        break;
      case 'document_change':
        this.handleDocumentChange(message);
        break;
      case 'error':
        this.handleError(message);
        break;
      case 'auth_required':
        console.warn('WebSocket 需要认证，尝试重新连接...');
        this.reconnect();
        break;
      default:
        console.warn('未知的 WebSocket 消息类型:', message.type);
    }
  }
  
  // 处理集合变更
  private handleCollectionChange(message: WSMessage): void {
    if (!message.collection || !message.data) return;
    
    this.listeners.forEach(listener => {
      if (listener.config.collection === message.collection && !listener.config.documentId) {
        try {
          // 构造 QuerySnapshot
          const documents = message.data.map((doc: any) => 
            new DocumentSnapshot(doc._id || doc.id, doc, true)
          );
          const querySnapshot = new QuerySnapshot(documents);
          listener.onNext(querySnapshot);
        } catch (error) {
          if (listener.onError) {
            listener.onError(error as Error);
          }
        }
      }
    });
  }
  
  // 处理文档变更
  private handleDocumentChange(message: WSMessage): void {
    if (!message.collection || !message.documentId) return;
    
    this.listeners.forEach(listener => {
      if (
        listener.config.collection === message.collection &&
        listener.config.documentId === message.documentId
      ) {
        try {
          const documentSnapshot = new DocumentSnapshot(
            message.documentId,
            message.data,
            message.operation !== 'delete'
          );
          listener.onNext(documentSnapshot);
        } catch (error) {
          if (listener.onError) {
            listener.onError(error as Error);
          }
        }
      }
    });
  }
  
  // 处理错误
  private handleError(message: WSMessage): void {
    console.error('WebSocket 服务器错误:', message.error);
    
    this.listeners.forEach(listener => {
      if (listener.onError) {
        listener.onError(new Error(message.error || 'WebSocket 服务器错误'));
      }
    });
  }
  
  // 订阅集合变更
  subscribeToCollection(config: SubscriptionConfig): void {
    const message: WSMessage = {
      type: 'collection_change',
      collection: config.collection,
      data: config.query || {}
    };
    
    this.sendMessage(message);
  }
  
  // 订阅文档变更
  subscribeToDocument(config: SubscriptionConfig): void {
    const message: WSMessage = {
      type: 'document_change',
      collection: config.collection,
      documentId: config.documentId
    };
    
    this.sendMessage(message);
  }
  
  // 添加集合监听器
  onCollectionSnapshot(
    collection: string,
    query: any,
    onNext: (snapshot: QuerySnapshot) => void,
    onError?: (error: Error) => void
  ): () => void {
    const listenerId = `collection_${collection}_${Date.now()}_${Math.random()}`;
    const config: SubscriptionConfig = { collection, query };
    
    const listener: Listener = {
      id: listenerId,
      config,
      onNext,
      onError
    };
    
    this.listeners.set(listenerId, listener);
    
    // 订阅集合变更
    this.subscribeToCollection(config);
    
    // 首次获取数据
    this.fetchInitialCollectionData(collection, query).then(snapshot => {
      onNext(snapshot);
    }).catch(error => {
      if (onError) onError(error);
    });
    
    // 返回取消监听的函数
    return () => {
      this.listeners.delete(listenerId);
      // TODO: 发送取消订阅消息到服务器
    };
  }
  
  // 添加文档监听器
  onDocumentSnapshot(
    collection: string,
    documentId: string,
    onNext: (snapshot: DocumentSnapshot) => void,
    onError?: (error: Error) => void
  ): () => void {
    const listenerId = `document_${collection}_${documentId}_${Date.now()}`;
    const config: SubscriptionConfig = { collection, documentId };
    
    const listener: Listener = {
      id: listenerId,
      config,
      onNext,
      onError
    };
    
    this.listeners.set(listenerId, listener);
    
    // 订阅文档变更
    this.subscribeToDocument(config);
    
    // 首次获取数据
    this.fetchInitialDocumentData(collection, documentId).then(snapshot => {
      onNext(snapshot);
    }).catch(error => {
      if (onError) onError(error);
    });
    
    // 返回取消监听的函数
    return () => {
      this.listeners.delete(listenerId);
      // TODO: 发送取消订阅消息到服务器
    };
  }
  
  // 获取初始集合数据
  private async fetchInitialCollectionData(collection: string, query: any): Promise<QuerySnapshot> {
    try {
      const response = await fetch('/api/collections/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({
          collection,
          query: query || {}
        }),
      });
      
      if (!response.ok) {
        throw new Error('获取集合数据失败');
      }
      
      const data = await response.json();
      const documents = data.map((doc: any) => 
        new DocumentSnapshot(doc._id || doc.id, doc, true)
      );
      
      return new QuerySnapshot(documents);
    } catch (error) {
      console.error('获取初始集合数据失败:', error);
      throw error;
    }
  }
  
  // 获取初始文档数据
  private async fetchInitialDocumentData(collection: string, documentId: string): Promise<DocumentSnapshot> {
    try {
      const response = await fetch('/api/collections/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({
          collection,
          documentId
        }),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return new DocumentSnapshot(documentId, null, false);
        }
        throw new Error('获取文档数据失败');
      }
      
      const data = await response.json();
      return new DocumentSnapshot(documentId, data, true);
    } catch (error) {
      console.error('获取初始文档数据失败:', error);
      throw error;
    }
  }
  
  // 手动重连
  reconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.reconnectAttempts = 0;
    this.connect();
  }
  
  // 断开连接
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, '手动关闭连接');
    }
    this.listeners.clear();
  }
  
  // 获取连接状态
  getConnectionState(): 'connecting' | 'open' | 'closed' {
    if (this.isConnecting) return 'connecting';
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return 'open';
    return 'closed';
  }
}

// 创建全局实时适配器实例
let realtimeInstance: RealtimeAdapter | null = null;

export const getRealtimeAdapter = (): RealtimeAdapter => {
  if (!realtimeInstance) {
    realtimeInstance = new RealtimeAdapter();
  }
  return realtimeInstance;
};

export default RealtimeAdapter;