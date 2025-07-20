// src/lib/migration-config.ts
/**
 * 迁移配置管理工具
 * 提供安全的渐进式迁移控制和配置验证
 */

export interface MigrationConfig {
  auth: boolean;
  database: boolean;
  storage: boolean;
  realtime: boolean;
}

export interface ServiceStatus {
  firebase: {
    auth: boolean;
    database: boolean;
    storage: boolean;
  };
  newServices: {
    auth: boolean;
    database: boolean;
    storage: boolean;
    realtime: boolean;
  };
  hybrid: boolean;
}

// 获取当前迁移配置
export const getMigrationConfig = (): MigrationConfig => {
  return {
    auth: process.env.NEXT_PUBLIC_USE_NEW_AUTH === 'true',
    database: process.env.NEXT_PUBLIC_USE_NEW_DATABASE === 'true',
    storage: process.env.NEXT_PUBLIC_USE_NEW_STORAGE === 'true',
    realtime: process.env.NEXT_PUBLIC_USE_NEW_REALTIME === 'true'
  };
};

// 获取服务状态
export const getServiceStatus = (): ServiceStatus => {
  const config = getMigrationConfig();
  
  return {
    firebase: {
      auth: !config.auth,
      database: !config.database,
      storage: !config.storage
    },
    newServices: {
      auth: config.auth,
      database: config.database,
      storage: config.storage,
      realtime: config.realtime
    },
    hybrid: Object.values(config).some(Boolean) && !Object.values(config).every(Boolean)
  };
};

// 验证配置完整性
export const validateMigrationConfig = (): { valid: boolean; errors: string[] } => {
  const config = getMigrationConfig();
  const errors: string[] = [];
  
  // 检查 MongoDB 配置
  if (config.database) {
    if (!process.env.MONGODB_URI) {
      errors.push('MongoDB URI 未配置 (MONGODB_URI)');
    }
    if (!process.env.MONGODB_DATABASE) {
      errors.push('MongoDB 数据库名未配置 (MONGODB_DATABASE)');
    }
  }
  
  // 检查 JWT 配置
  if (config.auth) {
    if (!process.env.JWT_SECRET) {
      errors.push('JWT 密钥未配置 (JWT_SECRET)');
    }
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      errors.push('JWT 密钥长度不足，至少需要 32 个字符');
    }
  }
  
  // 检查 OSS 配置
  if (config.storage) {
    if (!process.env.ALIBABA_CLOUD_ACCESS_KEY_ID) {
      errors.push('阿里云 Access Key ID 未配置');
    }
    if (!process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET) {
      errors.push('阿里云 Access Key Secret 未配置');
    }
    if (!process.env.ALIBABA_CLOUD_OSS_BUCKET) {
      errors.push('阿里云 OSS Bucket 未配置');
    }
  }
  
  // 检查 WebSocket 配置
  if (config.realtime) {
    if (!process.env.NEXT_PUBLIC_WS_URL) {
      errors.push('WebSocket URL 未配置 (NEXT_PUBLIC_WS_URL)');
    }
  }
  
  // 检查 Firebase 配置 (如果仍在使用)
  const status = getServiceStatus();
  if (status.firebase.auth || status.firebase.database || status.firebase.storage) {
    const requiredFirebaseEnvs = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];
    
    for (const env of requiredFirebaseEnvs) {
      if (!process.env[env]) {
        errors.push(`Firebase 配置缺失: ${env}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// 迁移阶段定义
export enum MigrationPhase {
  PREPARATION = 'preparation',    // 准备阶段：安装依赖，配置环境
  AUTH_MIGRATION = 'auth',        // 认证迁移：切换到 JWT
  DATABASE_MIGRATION = 'database', // 数据库迁移：切换到 MongoDB
  STORAGE_MIGRATION = 'storage',  // 存储迁移：切换到 OSS
  REALTIME_MIGRATION = 'realtime', // 实时功能迁移：启用 WebSocket
  COMPLETE = 'complete'           // 完成：完全使用新服务
}

// 获取当前迁移阶段
export const getCurrentMigrationPhase = (): MigrationPhase => {
  const config = getMigrationConfig();
  
  if (!config.auth && !config.database && !config.storage && !config.realtime) {
    return MigrationPhase.PREPARATION;
  }
  
  if (config.auth && !config.database && !config.storage && !config.realtime) {
    return MigrationPhase.AUTH_MIGRATION;
  }
  
  if (config.auth && config.database && !config.storage && !config.realtime) {
    return MigrationPhase.DATABASE_MIGRATION;
  }
  
  if (config.auth && config.database && config.storage && !config.realtime) {
    return MigrationPhase.STORAGE_MIGRATION;
  }
  
  if (config.auth && config.database && config.storage && config.realtime) {
    return MigrationPhase.COMPLETE;
  }
  
  // 混合状态
  return MigrationPhase.REALTIME_MIGRATION;
};

// 获取迁移进度百分比
export const getMigrationProgress = (): number => {
  const config = getMigrationConfig();
  const totalServices = 4; // auth, database, storage, realtime
  const migratedServices = Object.values(config).filter(Boolean).length;
  
  return Math.round((migratedServices / totalServices) * 100);
};

// 迁移建议
export const getMigrationRecommendations = (): string[] => {
  const phase = getCurrentMigrationPhase();
  const validation = validateMigrationConfig();
  const recommendations: string[] = [];
  
  if (!validation.valid) {
    recommendations.push('⚠️ 首先解决配置问题：');
    recommendations.push(...validation.errors.map(error => `  - ${error}`));
    return recommendations;
  }
  
  switch (phase) {
    case MigrationPhase.PREPARATION:
      recommendations.push('🚀 建议开始认证系统迁移');
      recommendations.push('  1. 设置 NEXT_PUBLIC_USE_NEW_AUTH=true');
      recommendations.push('  2. 测试登录/注册功能');
      recommendations.push('  3. 验证用户权限管理');
      break;
      
    case MigrationPhase.AUTH_MIGRATION:
      recommendations.push('📊 建议继续数据库迁移');
      recommendations.push('  1. 启动 MongoDB 服务');
      recommendations.push('  2. 运行数据迁移脚本');
      recommendations.push('  3. 设置 NEXT_PUBLIC_USE_NEW_DATABASE=true');
      break;
      
    case MigrationPhase.DATABASE_MIGRATION:
      recommendations.push('📤 建议进行存储迁移');
      recommendations.push('  1. 配置阿里云 OSS');
      recommendations.push('  2. 迁移现有文件');
      recommendations.push('  3. 设置 NEXT_PUBLIC_USE_NEW_STORAGE=true');
      break;
      
    case MigrationPhase.STORAGE_MIGRATION:
      recommendations.push('⚡ 建议启用实时功能');
      recommendations.push('  1. 启动 WebSocket 服务器');
      recommendations.push('  2. 测试实时订单同步');
      recommendations.push('  3. 设置 NEXT_PUBLIC_USE_NEW_REALTIME=true');
      break;
      
    case MigrationPhase.COMPLETE:
      recommendations.push('🎉 迁移完成！');
      recommendations.push('  1. 进行全面测试');
      recommendations.push('  2. 监控系统性能');
      recommendations.push('  3. 考虑清理 Firebase 依赖');
      break;
      
    default:
      recommendations.push('🔧 检测到混合配置状态');
      recommendations.push('  建议按顺序完成迁移：认证 → 数据库 → 存储 → 实时');
  }
  
  return recommendations;
};

// 安全检查
export const performSafetyCheck = (): { safe: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  const config = getMigrationConfig();
  const status = getServiceStatus();
  
  // 生产环境检查
  if (process.env.NODE_ENV === 'production') {
    if (status.hybrid) {
      warnings.push('⚠️ 生产环境检测到混合服务配置，可能存在风险');
    }
    
    if (process.env.JWT_SECRET === 'hospitakeaway-super-secret-jwt-key-for-development-only') {
      warnings.push('🚨 生产环境使用了开发用 JWT 密钥，严重安全风险！');
    }
    
    if (process.env.DEBUG_MODE === 'true') {
      warnings.push('⚠️ 生产环境启用了调试模式');
    }
  }
  
  // 配置一致性检查
  if (config.database && config.auth) {
    // 检查是否同时启用了新旧认证
    if (!process.env.MONGODB_URI) {
      warnings.push('⚠️ 启用了新数据库但未配置 MongoDB 连接');
    }
  }
  
  return {
    safe: warnings.length === 0,
    warnings
  };
};

// 导出配置管理工具
export const MigrationManager = {
  getConfig: getMigrationConfig,
  getStatus: getServiceStatus,
  validate: validateMigrationConfig,
  getPhase: getCurrentMigrationPhase,
  getProgress: getMigrationProgress,
  getRecommendations: getMigrationRecommendations,
  safetyCheck: performSafetyCheck
};

export default MigrationManager;