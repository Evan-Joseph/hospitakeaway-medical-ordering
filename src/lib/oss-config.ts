// src/lib/oss-config.ts
/**
 * 阿里云OSS配置文件
 * 提供与Firebase Storage兼容的接口
 */

import OSS from 'ali-oss';

// OSS配置接口
interface OSSConfig {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  endpoint?: string;
}

// 获取OSS配置
const getOSSConfig = (): OSSConfig => {
  const config = {
    region: process.env.ALI_OSS_REGION || 'oss-cn-hangzhou',
    accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.ALI_OSS_BUCKET || 'hospitakeaway-files',
    endpoint: process.env.ALI_OSS_ENDPOINT
  };

  // 验证必需的配置
  if (!config.accessKeyId || !config.accessKeySecret) {
    throw new Error('阿里云OSS访问密钥未配置');
  }

  return config;
};

// 创建OSS客户端
export const createOSSClient = (): OSS => {
  const config = getOSSConfig();
  
  return new OSS({
    region: config.region,
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    bucket: config.bucket,
    endpoint: config.endpoint
  });
};

// OSS文件路径生成器
export const generateOSSPath = (category: string, filename: string): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2);
  const ext = filename.split('.').pop();
  
  return `hospitakeaway/${category}/${timestamp}-${randomStr}.${ext}`;
};

// 预定义的文件分类
export const FILE_CATEGORIES = {
  AVATAR: 'avatars',           // 用户头像
  MENU_IMAGES: 'menu',         // 菜品图片  
  RESTAURANT_IMAGES: 'restaurants', // 餐厅图片
  QR_CODES: 'qrcodes',         // 二维码文件
  DOCUMENTS: 'documents'        // 文档文件
} as const;

export type FileCategory = typeof FILE_CATEGORIES[keyof typeof FILE_CATEGORIES];

// 文件大小限制（字节）
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024,      // 5MB
  DOCUMENT: 10 * 1024 * 1024,  // 10MB
  AVATAR: 2 * 1024 * 1024      // 2MB
};

// 允许的文件类型
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

export default {
  createOSSClient,
  generateOSSPath,
  FILE_CATEGORIES,
  FILE_SIZE_LIMITS,
  ALLOWED_FILE_TYPES
};
