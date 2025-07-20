# 🔥 Firebase 残留代码清理检查表

## 📊 总体情况
- ✅ 迁移适配器已创建 (`src/lib/firebase.ts`)
- ❌ 多个组件仍直接导入 Firebase 模块
- ❌ package.json 中缺少 Firebase 依赖
- ❌ 组件使用原生 Firebase 方法而非适配器

## 🔍 需要清理的文件

### 1. Context 文件 (最关键)
**文件**: `src/contexts/order-context.tsx`
- ❌ 直接导入 `firebase/firestore`
- ❌ 使用原生 Firestore 方法: `collection`, `addDoc`, `updateDoc`, `serverTimestamp`, `query`, `orderBy`, `Timestamp`, `getDoc`, `getDocs`, `onSnapshot`
- 🔧 **需要修改**: 使用适配器接口替换所有 Firestore 调用

**文件**: `src/contexts/favorites-context.tsx`
- ❌ 直接导入 `firebase/firestore`
- ❌ 使用原生 Firestore 方法: `collection`, `getDocs`, `setDoc`, `deleteDoc`, `doc`, `Timestamp`, `query`, `orderBy`
- 🔧 **需要修改**: 使用适配器接口替换所有 Firestore 调用

### 2. Page 组件文件
**文件**: `src/app/restaurants/[restaurantId]/page.tsx`
- ❌ 导入 `@/lib/firebase` 和 `firebase/firestore`
- ❌ 使用 `doc`, `getDoc`

**文件**: `src/app/restaurants/page.tsx`
- ❌ 导入 `@/lib/firebase` 和 `firebase/firestore`
- ❌ 使用 `collection`, `getDocs`, `query`, `where`

**文件**: `src/app/merchant/dashboard/settings/page.tsx`
- ❌ 导入 `@/lib/firebase` 和 `firebase/firestore`
- ❌ 使用 `doc`, `getDoc`, `updateDoc`

**文件**: `src/app/merchant/dashboard/promotions/page.tsx`
- ❌ 导入 `@/lib/firebase` 和 `firebase/firestore`
- ❌ 使用 `doc`, `getDoc`, `updateDoc`

**文件**: `src/app/merchant/dashboard/menu/page.tsx`
- ❌ 导入 `@/lib/firebase` 和 `firebase/firestore`
- ❌ 使用 `doc`, `getDoc`, `updateDoc`, `arrayUnion`, `arrayRemove`

**文件**: `src/app/favorites/page.tsx`
- ❌ 导入 `@/lib/firebase` 和 `firebase/firestore`
- ❌ 使用 `doc`, `getDoc`

**文件**: `src/app/checkout/page.tsx`
- ❌ 导入 `@/lib/firebase` 和 `firebase/firestore`
- ❌ 使用 `doc`, `getDoc`

**文件**: `src/app/cart/page.tsx`
- ❌ 导入 `@/lib/firebase` 和 `firebase/firestore`
- ❌ 使用 `doc`, `getDoc`

**文件**: `src/app/admin/dashboard/qrcodes/page.tsx`
- ❌ 导入 `@/lib/firebase` 和 `firebase/firestore`
- ❌ 使用 `collection`, `addDoc`, `getDocs`, `serverTimestamp`, `doc`, `updateDoc`, `query`, `orderBy`, `writeBatch`

**文件**: `src/app/admin/dashboard/merchants/page.tsx`
- ❌ 导入 `@/lib/firebase` 和 `firebase/firestore`
- ❌ 使用 `collection`, `getDocs`, `query`, `orderBy`, `doc`, `updateDoc`

### 3. 配置文件
**文件**: `src/lib/database.ts`
- ⚠️ 包含 Firebase 备用配置
- ❌ 导入完整 Firebase 模块作为备用

**文件**: `package.json`
- ❌ 缺少 Firebase 依赖 (导致编译错误)

## 🚨 当前错误
控制台显示 Firebase 模块导入错误:
```
Module not found: Can't resolve 'firebase/firestore'
```

## 🔧 修复策略

### 策略1: 添加 Firebase 依赖 (临时解决)
```bash
npm install firebase
```

### 策略2: 彻底清理 Firebase (推荐)
1. 更新所有导入语句从 `firebase/firestore` 改为使用适配器
2. 替换所有 Firestore 方法调用为适配器方法
3. 清理 `src/lib/database.ts` 中的 Firebase 备用代码

## 📋 清理任务列表

### 高优先级 (立即修复)
- [ ] 添加 Firebase 依赖或移除 Firebase 导入
- [ ] 修复 `order-context.tsx` 中的 Firestore 调用
- [ ] 修复 `favorites-context.tsx` 中的 Firestore 调用

### 中优先级 (迁移完成后)
- [ ] 清理所有 page 组件中的 Firebase 导入
- [ ] 更新所有数据库调用使用适配器
- [ ] 移除 `src/lib/database.ts` 中的 Firebase 备用代码

### 低优先级 (清理优化)
- [ ] 移除不必要的 Firebase 依赖
- [ ] 清理注释和废弃代码
- [ ] 更新文档和类型定义

## 🎯 建议的 Clacky 迁移顺序
1. **首先**: 添加 Firebase 依赖解决编译错误
2. **其次**: 逐个文件迁移到适配器系统
3. **最后**: 移除 Firebase 依赖和清理代码

## 📝 注意事项
- 迁移过程中保持功能完整性
- 测试每个迁移的组件
- 保留原始文件备份
- 使用渐进式迁移避免大规模破坏

---
*生成时间: 2025年7月20日*
*总共发现: 11个主要文件需要迁移*
*预估工作量: 4-6小时*
