// src/app/admin/migration/page.tsx
/**
 * 迁移管理页面
 * 提供可视化的迁移控制面板
 */

"use client";

import React from 'react';
import { MigrationDashboard } from '@/components/migration/migration-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MigrationPage() {
  const handleRunTests = () => {
    console.log('运行迁移测试...');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🚀 Firebase 迁移控制中心
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          监控和管理从 Firebase 到国内服务的迁移进度
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 迁移概览
            </CardTitle>
            <CardDescription>
              当前迁移状态和进度
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>认证系统</span>
                <span className="text-orange-500">Firebase Auth</span>
              </div>
              <div className="flex justify-between">
                <span>数据库</span>
                <span className="text-orange-500">Firebase Firestore</span>
              </div>
              <div className="flex justify-between">
                <span>存储</span>
                <span className="text-orange-500">Firebase Storage</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 目标环境
            </CardTitle>
            <CardDescription>
              迁移到国内友好的服务
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>认证系统</span>
                <span className="text-green-500">JWT 认证</span>
              </div>
              <div className="flex justify-between">
                <span>数据库</span>
                <span className="text-green-500">MongoDB</span>
              </div>
              <div className="flex justify-between">
                <span>存储</span>
                <span className="text-green-500">阿里云 OSS</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚡ 核心优势
            </CardTitle>
            <CardDescription>
              迁移后的主要改善
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>国内访问</span>
                <span className="text-green-500">✓ 无需翻墙</span>
              </div>
              <div className="flex justify-between">
                <span>性能提升</span>
                <span className="text-green-500">✓ 50-70%</span>
              </div>
              <div className="flex justify-between">
                <span>成本节约</span>
                <span className="text-green-500">✓ 70%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <MigrationDashboard 
        onRunTests={handleRunTests}
        className="w-full"
      />

      <Card>
        <CardHeader>
          <CardTitle>📚 迁移指南</CardTitle>
          <CardDescription>
            详细的步骤说明和最佳实践
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">🔧 环境配置</h3>
              <p className="text-gray-600 dark:text-gray-300">
                修改 <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">.env.local</code> 文件中的迁移开关来控制各个服务的切换。
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">📋 迁移步骤</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-300">
                <li>启用 MongoDB 数据库适配器</li>
                <li>切换到 JWT 认证系统</li>
                <li>配置阿里云 OSS 存储</li>
                <li>启用 WebSocket 实时通信</li>
                <li>运行完整测试套件</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🧪 测试验证</h3>
              <p className="text-gray-600 dark:text-gray-300">
                使用内置的测试套件验证新旧系统的兼容性，确保迁移过程的安全性。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
