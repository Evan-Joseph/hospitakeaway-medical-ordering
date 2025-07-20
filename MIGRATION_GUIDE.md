# HospiTakeAway Firebase 迁移指南

## 📖 概述

本指南详细说明如何将 HospiTakeAway 项目从 Firebase 迁移到国内服务环境（MongoDB + JWT + 阿里云 OSS + WebSocket）。

## 🎯 迁移目标

| 服务类型 | 从 | 到 |
|---------|-----|-----|
| 数据库 | Firebase Firestore | MongoDB |
| 认证 | Firebase Auth | JWT 认证系统 |
| 存储 | Firebase Storage | 阿里云 OSS |
| 实时同步 | Firebase Realtime | WebSocket |

## 🚀 快速开始

### 1. 环境准备

```bash
# 1. 克隆项目
git clone <your-repo>
cd HospiTakeAway

# 2. 安装依赖
pnpm install

# 3. 复制环境配置
cp .env.example .env.local

# 4. 编辑配置文件
# 根据你的实际环境修改 .env.local
```

### 2. 特性开关配置

在 `.env.local` 中控制迁移进度：

```env
# 渐进式迁移 - 逐步启用新服务
NEXT_PUBLIC_USE_NEW_AUTH=false      # JWT 认证
NEXT_PUBLIC_USE_NEW_DATABASE=false  # MongoDB 数据库
NEXT_PUBLIC_USE_NEW_STORAGE=false   # 阿里云 OSS
NEXT_PUBLIC_USE_NEW_REALTIME=false  # WebSocket 实时同步
```

### 3. 启动项目

```bash
# 开发环境
pnpm dev

# 访问迁移面板（开发环境）
http://localhost:9002/admin/migration
```

## 📋 迁移步骤

### 阶段 1: 准备工作 (第1周)

**目标**: 环境搭建和适配器测试

1. **安装 MongoDB**
   ```bash
   # 使用 Docker
   docker run -d --name mongo -p 27017:27017 mongo:latest
   
   # 或安装本地版本
   # https://www.mongodb.com/try/download/community
   ```

2. **配置环境变量**
   ```env
   # MongoDB 配置
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DATABASE=hospitakeaway
   
   # JWT 配置
   JWT_SECRET=your-super-secret-jwt-key-32-chars-min
   JWT_EXPIRES_IN=15m
   REFRESH_TOKEN_EXPIRES_IN=7d
   ```

3. **测试适配器**
   ```bash
   # 运行适配器兼容性测试
   pnpm test:adapters
   ```

### 阶段 2: 认证系统迁移 (第2周)

**目标**: 从 Firebase Auth 切换到 JWT 认证

1. **启用新认证系统**
   ```env
   NEXT_PUBLIC_USE_NEW_AUTH=true
   ```

2. **配置 JWT 设置**
   ```env
   JWT_SECRET=your-production-secret-key
   NEXT_PUBLIC_AUTH_API_URL=/api/auth
   ```

3. **测试认证功能**
   - ✅ 用户注册
   - ✅ 用户登录
   - ✅ 权限验证
   - ✅ 管理员功能

4. **迁移用户数据**
   ```bash
   # 运行用户数据迁移脚本
   pnpm migrate:users
   ```

### 阶段 3: 数据库迁移 (第3周)

**目标**: 从 Firestore 切换到 MongoDB

1. **启用新数据库**
   ```env
   NEXT_PUBLIC_USE_NEW_DATABASE=true
   ```

2. **数据迁移**
   ```bash
   # 导出 Firestore 数据
   pnpm export:firestore
   
   # 导入到 MongoDB
   pnpm import:mongodb
   
   # 验证数据完整性
   pnpm verify:migration
   ```

3. **测试数据操作**
   - ✅ 餐厅管理
   - ✅ 订单系统
   - ✅ 二维码管理
   - ✅ 收藏功能

### 阶段 4: 存储迁移 (第4周)

**目标**: 从 Firebase Storage 切换到阿里云 OSS

1. **配置阿里云 OSS**
   ```env
   ALIBABA_CLOUD_ACCESS_KEY_ID=your_key_id
   ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_secret
   ALIBABA_CLOUD_OSS_BUCKET=hospitakeaway-prod
   ALIBABA_CLOUD_OSS_REGION=oss-cn-hangzhou
   ```

2. **启用新存储**
   ```env
   NEXT_PUBLIC_USE_NEW_STORAGE=true
   ```

3. **文件迁移**
   ```bash
   # 迁移现有文件到 OSS
   pnpm migrate:files
   ```

### 阶段 5: 实时功能迁移 (第5周)

**目标**: 启用 WebSocket 实时同步

1. **启动 WebSocket 服务器**
   ```bash
   # 启动 WebSocket 服务
   pnpm start:websocket
   ```

2. **启用实时同步**
   ```env
   NEXT_PUBLIC_USE_NEW_REALTIME=true
   NEXT_PUBLIC_WS_URL=ws://localhost:3001
   ```

3. **测试实时功能**
   - ✅ 订单状态实时更新
   - ✅ 多用户同步
   - ✅ 连接恢复机制

## 🔧 配置参考

### 完整环境变量

```env
# 特性开关
NEXT_PUBLIC_USE_NEW_AUTH=true
NEXT_PUBLIC_USE_NEW_DATABASE=true
NEXT_PUBLIC_USE_NEW_STORAGE=true
NEXT_PUBLIC_USE_NEW_REALTIME=true

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=hospitakeaway

# JWT 认证
JWT_SECRET=your-production-jwt-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# 阿里云 OSS
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret
ALIBABA_CLOUD_OSS_BUCKET=hospitakeaway-prod
ALIBABA_CLOUD_OSS_REGION=oss-cn-hangzhou

# WebSocket
NEXT_PUBLIC_WS_URL=ws://your-domain:3001
WS_SERVER_PORT=3001

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### MongoDB 索引配置

```javascript
// 在 MongoDB 中创建必要的索引
db.restaurants.createIndex({ "ownerUid": 1 })
db.restaurants.createIndex({ "status": 1 })
db.orders.createIndex({ "restaurantId": 1 })
db.orders.createIndex({ "orderDate": -1 })
db.bedQrCodes.createIndex({ "bedId": 1 })
db.bedQrCodes.createIndex({ "isActive": 1 })
db.favorites.createIndex({ "userId": 1, "itemId": 1 })
```

## 🧪 测试和验证

### 自动化测试

```bash
# 运行所有测试
pnpm test

# 运行适配器测试
pnpm test:adapters

# 运行集成测试
pnpm test:integration

# 性能测试
pnpm test:performance
```

### 手动测试清单

#### 用户功能测试
- [ ] 用户注册和登录
- [ ] 扫描二维码下单
- [ ] 浏览餐厅和菜品
- [ ] 添加到购物车
- [ ] 下单和支付
- [ ] 订单跟踪
- [ ] 收藏功能

#### 商家功能测试
- [ ] 商家注册和审核
- [ ] 菜单管理
- [ ] 订单管理
- [ ] 促销活动设置
- [ ] 支付方式配置

#### 管理员功能测试
- [ ] 商家审核
- [ ] 二维码管理
- [ ] 系统监控

#### 性能测试
- [ ] 页面加载速度
- [ ] 数据库查询性能
- [ ] 实时同步延迟
- [ ] 文件上传下载速度

## 🚨 故障排除

### 常见问题

#### 1. 连接 MongoDB 失败
```bash
# 检查 MongoDB 服务
sudo service mongod status

# 检查端口占用
netstat -tlnp | grep :27017

# 检查防火墙
sudo ufw status
```

#### 2. JWT 认证失败
```bash
# 检查 JWT 密钥长度
echo $JWT_SECRET | wc -c  # 应该 >= 32

# 检查时间同步
date
```

#### 3. 阿里云 OSS 连接失败
```bash
# 测试网络连接
ping oss-cn-hangzhou.aliyuncs.com

# 验证密钥权限
# 确保 AccessKey 有 OSS 读写权限
```

#### 4. WebSocket 连接失败
```bash
# 检查 WebSocket 服务
netstat -tlnp | grep :3001

# 检查防火墙规则
sudo ufw allow 3001
```

### 回滚策略

如果迁移过程中遇到问题，可以快速回滚：

```env
# 紧急回滚到 Firebase
NEXT_PUBLIC_USE_NEW_AUTH=false
NEXT_PUBLIC_USE_NEW_DATABASE=false
NEXT_PUBLIC_USE_NEW_STORAGE=false
NEXT_PUBLIC_USE_NEW_REALTIME=false
```

## 📊 性能对比

### 预期性能提升

| 指标 | Firebase | 新架构 | 提升 |
|------|----------|--------|------|
| 查询延迟 | 200-500ms | 50-150ms | 70% |
| 文件上传 | 1-3MB/s | 5-10MB/s | 200% |
| 实时同步 | 100-300ms | 50-100ms | 50% |
| 月度成本 | $200-500 | $50-150 | 70% |

## 🔒 安全注意事项

### 生产环境安全清单

- [ ] JWT 密钥足够复杂且安全存储
- [ ] MongoDB 启用认证和访问控制
- [ ] 阿里云 OSS 配置正确的 Bucket 权限
- [ ] WebSocket 连接使用 WSS (HTTPS)
- [ ] 所有敏感信息使用环境变量
- [ ] 定期更新依赖包
- [ ] 配置合适的 CORS 策略
- [ ] 启用日志监控和告警

## 📞 支持

如果在迁移过程中遇到问题：

1. **查看日志**: `pnpm logs`
2. **运行诊断**: `pnpm diagnose`
3. **检查迁移面板**: `http://localhost:9002/admin/migration`
4. **提交 Issue**: 在项目仓库中创建 Issue

## 🎉 迁移完成后

### 清理工作

```env
# 可以选择性删除 Firebase 相关环境变量
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ...
```

### 监控和维护

- 设置系统监控和告警
- 定期备份 MongoDB 数据
- 监控阿里云 OSS 使用量
- 优化查询性能
- 更新安全配置

恭喜！🎉 你已经成功完成了从 Firebase 到国内服务的迁移！