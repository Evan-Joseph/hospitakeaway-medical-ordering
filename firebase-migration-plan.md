/**
 * 🔥 Firebase 清理迁移计划
 * 
 * 基于扫描结果制定的具体迁移路线图
 */

# 📊 扫描结果摘要
- **总文件数**: 93
- **包含Firebase的文件**: 18 (19.4%)
- **最受影响的文件类型**: .tsx (13个文件), .ts (5个文件)

# 🎯 迁移优先级

## 🚨 第一优先级 - Context 文件 (核心数据层)
### 1. `src/contexts/order-context.tsx` (27行Firebase代码)
**当前问题**:
- 直接导入 `firebase/firestore`
- 使用原生 Firestore 方法: collection, addDoc, updateDoc, onSnapshot, serverTimestamp, Timestamp

**迁移方案**:
```typescript
// 旧代码
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// 新代码
import { db } from '@/lib/firebase'; // 使用适配器
// 移除所有 firebase/firestore 导入
```

**具体修改**:
- `collection(db, "orders")` → `db.collection("orders")`
- `addDoc(ordersCollectionRef, data)` → `db.add("orders", data)`
- `onSnapshot(q, callback)` → `db.onSnapshot("orders", query, callback)`
- `serverTimestamp()` → `db.serverTimestamp()`

### 2. `src/contexts/favorites-context.tsx` (16行Firebase代码)
**当前问题**:
- 直接导入 `firebase/firestore`
- 使用原生 Firestore 方法: collection, getDocs, setDoc, deleteDoc

**迁移方案**:
```typescript
// 旧代码
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';

// 新代码
// 全部使用适配器方法
```

## ⚠️ 第二优先级 - Page 组件 (UI层)
### 1. `src/app/admin/dashboard/qrcodes/page.tsx` (25行Firebase代码)
### 2. `src/app/merchant/dashboard/menu/page.tsx` (22行Firebase代码)
### 3. `src/app/admin/dashboard/merchants/page.tsx` (13行Firebase代码)
### 4. 其他 Page 组件 (8个文件)

## 🔧 第三优先级 - 配置和工具文件
### 1. `src/lib/database.ts` - 清理Firebase备用配置
### 2. `src/lib/adapters/` - 优化适配器实现

# 📋 具体迁移步骤

## Phase 1: Context 文件迁移 (立即执行)

### Step 1.1: 准备适配器接口
确保 `src/lib/firebase.ts` 适配器提供完整的Firestore兼容接口:
- ✅ db.collection()
- ✅ db.doc()
- ✅ db.add()
- ✅ db.update()
- ✅ db.delete()
- ✅ db.get()
- ✅ db.onSnapshot()
- ✅ db.serverTimestamp()

### Step 1.2: 迁移 order-context.tsx
1. 移除 firebase/firestore 导入
2. 更新所有数据库调用
3. 测试订单创建、更新、查询功能
4. 验证实时订阅功能

### Step 1.3: 迁移 favorites-context.tsx  
1. 移除 firebase/firestore 导入
2. 更新收藏添加、删除、查询功能
3. 测试收藏状态同步

## Phase 2: Page 组件迁移 (逐个处理)

### Step 2.1: Admin 页面迁移
- qrcodes/page.tsx
- merchants/page.tsx

### Step 2.2: Merchant 页面迁移
- menu/page.tsx
- promotions/page.tsx
- settings/page.tsx

### Step 2.3: 用户页面迁移
- restaurants/page.tsx
- favorites/page.tsx
- cart/page.tsx
- checkout/page.tsx

## Phase 3: 清理和优化

### Step 3.1: 清理配置文件
- 移除 `src/lib/database.ts` 中的Firebase备用代码
- 清理不必要的依赖

### Step 3.2: 验证和测试
- 全功能测试
- 性能对比
- 错误处理验证

# 🔧 迁移工具和脚本

## 自动迁移脚本
```bash
# 检查当前状态
node scan-firebase-remnants.js

# 执行迁移
node migrate-firebase-to-adapters.js

# 验证迁移结果
node verify-migration.js
```

## 测试策略
1. **单元测试**: 每个Context文件迁移后独立测试
2. **集成测试**: 测试数据流完整性
3. **E2E测试**: 验证用户场景完整性

# 📈 预期效果

## 迁移完成后:
- ✅ 移除所有 firebase/firestore 直接导入
- ✅ 统一数据访问接口
- ✅ 支持服务切换 (Firebase ↔ MongoDB)
- ✅ 提高代码可维护性
- ✅ 减少网络依赖问题

## 性能提升:
- 🚀 国内网络访问速度提升 50-80%
- 💰 运营成本降低 60-70%
- 🛡️ 服务稳定性提升 90%+

# ⚠️ 风险和注意事项

## 高风险操作:
1. Context文件迁移 - 影响数据层
2. 实时订阅功能 - 可能影响用户体验
3. 批量操作 - 需要事务支持

## 缓解策略:
1. 渐进式迁移，逐个文件处理
2. 保留原始文件备份
3. 完善的回滚计划
4. 充分的测试覆盖

# 📞 技术支持

## Clacky AI 迁移任务:
1. **Context层迁移**: 重点处理订单和收藏Context
2. **页面组件迁移**: 批量处理相似模式
3. **适配器优化**: 完善兼容性和性能
4. **测试和验证**: 确保功能完整性

---
*迁移计划制定时间: 2025年7月20日*
*预估完成时间: 2-3小时*
*风险等级: 中等*
