// src/components/migration/migration-dashboard.tsx
/**
 * 迁移状态面板组件
 * 显示迁移进度、配置状态和测试结果
 */

"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Play,
  Database,
  Shield,
  Cloud,
  Zap
} from 'lucide-react';

import { 
  MigrationManager, 
  MigrationPhase, 
  type MigrationConfig, 
  type ServiceStatus 
} from '@/lib/migration-config';

import { AdapterTestSuite, type TestSuite } from '@/lib/adapters/test-suite';

interface MigrationDashboardProps {
  onRunTests?: () => void;
  className?: string;
}

export const MigrationDashboard: React.FC<MigrationDashboardProps> = ({ 
  onRunTests,
  className = ""
}) => {
  const [config, setConfig] = useState<MigrationConfig | null>(null);
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [testResults, setTestResults] = useState<TestSuite[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = () => {
    setConfig(MigrationManager.getConfig());
    setStatus(MigrationManager.getStatus());
  };

  const runTests = async () => {
    if (isRunningTests) return;
    
    setIsRunningTests(true);
    try {
      // 这里需要传入实际的服务实例
      // 在实际使用中，需要从适当的地方获取这些实例
      const testSuite = new AdapterTestSuite();
      const results = await testSuite.runAllTests({
        // db: await getDB(),
        // auth: await getAuthService(),
        // storage: await getStorageService()
      });
      
      setTestResults(results.summary);
      
      if (onRunTests) {
        onRunTests();
      }
    } catch (error) {
      console.error('测试运行失败:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  if (!config || !status) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p>加载迁移状态...</p>
        </div>
      </div>
    );
  }

  const currentPhase = MigrationManager.getPhase();
  const progress = MigrationManager.getProgress();
  const validation = MigrationManager.validate();
  const recommendations = MigrationManager.getRecommendations();
  const safetyCheck = MigrationManager.safetyCheck();

  const getPhaseColor = (phase: MigrationPhase) => {
    switch (phase) {
      case MigrationPhase.PREPARATION:
        return 'bg-gray-500';
      case MigrationPhase.AUTH_MIGRATION:
        return 'bg-blue-500';
      case MigrationPhase.DATABASE_MIGRATION:
        return 'bg-green-500';
      case MigrationPhase.STORAGE_MIGRATION:
        return 'bg-purple-500';
      case MigrationPhase.REALTIME_MIGRATION:
        return 'bg-orange-500';
      case MigrationPhase.COMPLETE:
        return 'bg-emerald-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'auth':
        return <Shield className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'storage':
        return <Cloud className="h-4 w-4" />;
      case 'realtime':
        return <Zap className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 总览卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Firebase 迁移状态面板
          </CardTitle>
          <CardDescription>
            监控从 Firebase 到国内服务的迁移进度
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 进度条 */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">迁移进度</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
            
            {/* 当前阶段 */}
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={`text-white ${getPhaseColor(currentPhase)}`}
              >
                {currentPhase}
              </Badge>
              <span className="text-sm text-gray-600">
                当前迁移阶段
              </span>
            </div>
            
            {/* 安全检查警告 */}
            {!safetyCheck.safe && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>安全警告:</strong>
                  <ul className="mt-1 ml-4 list-disc">
                    {safetyCheck.warnings.map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {/* 配置验证错误 */}
            {!validation.valid && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>配置错误:</strong>
                  <ul className="mt-1 ml-4 list-disc">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">服务状态</TabsTrigger>
          <TabsTrigger value="recommendations">建议</TabsTrigger>
          <TabsTrigger value="tests">测试结果</TabsTrigger>
          <TabsTrigger value="config">配置</TabsTrigger>
        </TabsList>

        {/* 服务状态 */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Firebase 服务 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🔥 Firebase 服务
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(status.firebase).map(([service, enabled]) => (
                    <div key={service} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {getServiceIcon(service)}
                        {service}
                      </span>
                      <Badge variant={enabled ? "default" : "secondary"}>
                        {enabled ? "使用中" : "已停用"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 新服务 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🚀 新服务
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(status.newServices).map(([service, enabled]) => (
                    <div key={service} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {getServiceIcon(service)}
                        {service}
                      </span>
                      <Badge variant={enabled ? "default" : "secondary"}>
                        {enabled ? "已启用" : "未启用"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 迁移建议 */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>迁移建议</CardTitle>
              <CardDescription>
                基于当前状态的下一步行动建议
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 测试结果 */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>适配器测试</CardTitle>
                <CardDescription>
                  验证新适配器的兼容性和功能完整性
                </CardDescription>
              </div>
              <Button
                onClick={runTests}
                disabled={isRunningTests}
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunningTests ? "运行中..." : "运行测试"}
              </Button>
            </CardHeader>
            <CardContent>
              {testResults ? (
                <div className="space-y-4">
                  {testResults.map((suite, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{suite.name}</h4>
                        <div className="flex gap-2">
                          <Badge variant="default">
                            {suite.passed} 通过
                          </Badge>
                          {suite.failed > 0 && (
                            <Badge variant="destructive">
                              {suite.failed} 失败
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {suite.results.map((result, resultIndex) => (
                          <div key={resultIndex} className="flex items-center gap-2 text-sm">
                            {result.passed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span>{result.name}</span>
                            <span className="text-gray-500">({result.duration}ms)</span>
                            {result.error && (
                              <span className="text-red-500 text-xs">
                                {result.error}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-4" />
                  <p>点击"运行测试"开始兼容性测试</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 配置详情 */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>当前配置</CardTitle>
              <CardDescription>
                环境变量和特性开关状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">特性开关</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(config).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{key}</span>
                        <Badge variant={value ? "default" : "secondary"}>
                          {value ? "启用" : "禁用"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">环境信息</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Node 环境: {process.env.NODE_ENV}</p>
                    <p>混合模式: {status.hybrid ? "是" : "否"}</p>
                    <p>迁移阶段: {currentPhase}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MigrationDashboard;