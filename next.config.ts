import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.picui.cn', // Added PICUI hostname
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // 支持外部主机访问（Clacky 开发环境）
    allowedDevOrigins: [
      '*.clackypaas.com',
      'localhost:9002'
    ],
  },
  // Webpack 配置解决 Node.js 模块在浏览器中的问题
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 在客户端环境中禁用 Node.js 模块
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        util: false,
        url: false,
        querystring: false,
        punycode: false,
        dns: false,
        child_process: false,
        'timers/promises': false,
        'fs/promises': false,
      };
      
      // 忽略 MongoDB 和其他 Node.js 专用包
      config.resolve.alias = {
        ...config.resolve.alias,
        'mongodb': false,
        'mongodb-client-encryption': false,
        'gcp-metadata': false,
        '@mongodb-js/saslprep': false,
        'kerberos': false,
        'snappy': false,
        'bson-ext': false,
      };
    }
    
    return config;
  },
};

export default nextConfig;