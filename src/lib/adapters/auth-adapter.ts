// src/lib/adapters/auth-adapter.ts
/**
 * JWT 认证适配器 - 完全兼容 Firebase Auth 接口
 * 这个适配器使前端代码无需修改，只需替换底层认证服务
 */

// 兼容 Firebase Auth 的类型定义
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
}

export interface AuthError extends Error {
  code: string;
  message: string;
}

export interface UserCredential {
  user: User;
}

export interface IdTokenResult {
  token: string;
  authTime: string;
  issuedAtTime: string;
  expirationTime: string;
  signInProvider: string;
  claims: { [key: string]: any };
}

// JWT Token 响应接口
interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// 认证适配器类
export class AuthAdapter {
  private currentUser: User | null = null;
  private listeners: Array<(user: User | null) => void> = [];
  private refreshTimer: NodeJS.Timeout | null = null;
  
  constructor(private apiBaseUrl: string = '/api/auth') {}
  
  // 完全兼容 Firebase 的 onAuthStateChanged
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    // 添加监听器
    this.listeners.push(callback);
    
    // 立即检查本地存储的认证状态
    this.checkAuthState().then(user => {
      this.currentUser = user;
      callback(user);
    });
    
    // 返回取消监听的函数
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  // 兼容 Firebase 的登录方法
  async signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw this.createAuthError(error.code || 'auth/invalid-credential', error.message);
      }
      
      const authData: AuthResponse = await response.json();
      
      // 存储 tokens
      this.storeTokens(authData.accessToken, authData.refreshToken);
      
      // 设置自动刷新
      this.setupTokenRefresh(authData.expiresIn);
      
      // 更新当前用户状态
      this.currentUser = authData.user;
      this.notifyListeners(authData.user);
      
      return { user: authData.user };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createAuthError('auth/network-error', '网络连接失败');
    }
  }
  
  // 兼容 Firebase 的注册方法
  async createUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw this.createAuthError(error.code || 'auth/email-already-in-use', error.message);
      }
      
      const authData: AuthResponse = await response.json();
      
      // 存储 tokens
      this.storeTokens(authData.accessToken, authData.refreshToken);
      
      // 设置自动刷新
      this.setupTokenRefresh(authData.expiresIn);
      
      // 更新当前用户状态
      this.currentUser = authData.user;
      this.notifyListeners(authData.user);
      
      return { user: authData.user };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createAuthError('auth/network-error', '网络连接失败');
    }
  }
  
  // 兼容 Firebase 的登出方法
  async signOut(): Promise<void> {
    try {
      // 调用服务器端登出 API（可选）
      const token = this.getStoredAccessToken();
      if (token) {
        await fetch(`${this.apiBaseUrl}/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.warn('服务器端登出失败:', error);
    } finally {
      // 清除本地存储
      this.clearTokens();
      
      // 清除刷新定时器
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
      
      // 更新状态
      this.currentUser = null;
      this.notifyListeners(null);
    }
  }
  
  // 兼容 Firebase 的获取 ID Token 方法
  async getIdTokenResult(user: User): Promise<IdTokenResult> {
    try {
      const token = this.getStoredAccessToken();
      if (!token) {
        throw this.createAuthError('auth/user-token-expired', '用户令牌已过期');
      }
      
      const response = await fetch(`${this.apiBaseUrl}/token-info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw this.createAuthError('auth/invalid-user-token', '无效的用户令牌');
      }
      
      const tokenInfo = await response.json();
      
      return {
        token,
        authTime: tokenInfo.authTime,
        issuedAtTime: tokenInfo.issuedAtTime,
        expirationTime: tokenInfo.expirationTime,
        signInProvider: 'password',
        claims: tokenInfo.claims || {}
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createAuthError('auth/network-error', '网络连接失败');
    }
  }
  
  // 获取当前用户
  getCurrentUser(): User | null {
    return this.currentUser;
  }
  
  // 检查认证状态（从本地存储恢复）
  private async checkAuthState(): Promise<User | null> {
    try {
      const token = this.getStoredAccessToken();
      if (!token) {
        return null;
      }
      
      const response = await fetch(`${this.apiBaseUrl}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        // Token 可能过期，尝试刷新
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          this.clearTokens();
          return null;
        }
        return this.currentUser;
      }
      
      const userData = await response.json();
      return userData.user;
    } catch (error) {
      console.warn('检查认证状态失败:', error);
      this.clearTokens();
      return null;
    }
  }
  
  // 刷新访问令牌
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = this.getStoredRefreshToken();
      if (!refreshToken) {
        return false;
      }
      
      const response = await fetch(`${this.apiBaseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        return false;
      }
      
      const authData: AuthResponse = await response.json();
      
      // 更新存储的 tokens
      this.storeTokens(authData.accessToken, authData.refreshToken);
      
      // 重新设置刷新定时器
      this.setupTokenRefresh(authData.expiresIn);
      
      // 更新当前用户
      this.currentUser = authData.user;
      this.notifyListeners(authData.user);
      
      return true;
    } catch (error) {
      console.warn('刷新令牌失败:', error);
      return false;
    }
  }
  
  // 设置令牌自动刷新
  private setupTokenRefresh(expiresIn: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // 在过期前 5 分钟刷新令牌
    const refreshTime = Math.max(expiresIn - 5 * 60, 60) * 1000;
    
    this.refreshTimer = setTimeout(async () => {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        // 刷新失败，需要重新登录
        await this.signOut();
      }
    }, refreshTime);
  }
  
  // 存储令牌
  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('auth_access_token', accessToken);
    localStorage.setItem('auth_refresh_token', refreshToken);
  }
  
  // 获取存储的访问令牌
  private getStoredAccessToken(): string | null {
    return localStorage.getItem('auth_access_token');
  }
  
  // 获取存储的刷新令牌
  private getStoredRefreshToken(): string | null {
    return localStorage.getItem('auth_refresh_token');
  }
  
  // 清除令牌
  private clearTokens(): void {
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_refresh_token');
  }
  
  // 通知所有监听器
  private notifyListeners(user: User | null): void {
    this.listeners.forEach(callback => callback(user));
  }
  
  // 创建认证错误
  private createAuthError(code: string, message: string): AuthError {
    const error = new Error(message) as AuthError;
    error.code = code;
    return error;
  }
  
  // 获取当前访问令牌（用于 API 请求）
  getAccessToken(): string | null {
    return this.getStoredAccessToken();
  }
}

// 创建全局认证实例
let authInstance: AuthAdapter | null = null;

export const getAuth = (): AuthAdapter => {
  if (!authInstance) {
    authInstance = new AuthAdapter();
  }
  return authInstance;
};

// 导出兼容 Firebase 的函数
export const onAuthStateChanged = (
  auth: AuthAdapter,
  callback: (user: User | null) => void
): (() => void) => {
  return auth.onAuthStateChanged(callback);
};

export const signInWithEmailAndPassword = (
  auth: AuthAdapter,
  email: string,
  password: string
): Promise<UserCredential> => {
  return auth.signInWithEmailAndPassword(email, password);
};

export const createUserWithEmailAndPassword = (
  auth: AuthAdapter,
  email: string,
  password: string
): Promise<UserCredential> => {
  return auth.createUserWithEmailAndPassword(email, password);
};

export const signOut = (auth: AuthAdapter): Promise<void> => {
  return auth.signOut();
};

export const getIdTokenResult = (user: User): Promise<IdTokenResult> => {
  const auth = getAuth();
  return auth.getIdTokenResult(user);
};

export default AuthAdapter;