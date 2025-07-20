/**
 * Firebase 残留代码检查工具
 * 扫描项目中所有 Firebase 相关的残留代码
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, 'src');

// Firebase 相关的关键词
const firebasePatterns = [
  'firebase/firestore',
  'firebase/auth', 
  'firebase/storage',
  'firebase/app',
  'from.*firebase',
  'import.*firebase',
  '@/lib/firebase',
  'collection\\(',
  'doc\\(',
  'getDoc\\(',
  'getDocs\\(',
  'addDoc\\(',
  'updateDoc\\(',
  'deleteDoc\\(',
  'setDoc\\(',
  'onSnapshot\\(',
  'serverTimestamp\\(',
  'Timestamp\\.',
  'query\\(',
  'orderBy\\(',
  'where\\(',
  'arrayUnion\\(',
  'arrayRemove\\(',
  'writeBatch\\(',
];

// 扫描结果
const scanResults = {
  totalFiles: 0,
  filesWithFirebase: 0,
  firebaseReferences: [],
  summary: {}
};

// 递归扫描文件
function scanDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 等目录
      if (!item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      // 只检查特定文件类型
      const ext = path.extname(item);
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        scanFile(fullPath);
      }
    }
  }
}

// 扫描单个文件
function scanFile(filePath) {
  scanResults.totalFiles++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(projectRoot, filePath);
    
    const foundPatterns = [];
    
    // 检查每个 Firebase 模式
    for (const pattern of firebasePatterns) {
      const regex = new RegExp(pattern, 'gi');
      const matches = content.match(regex);
      
      if (matches) {
        foundPatterns.push({
          pattern,
          matches: matches.length,
          examples: matches.slice(0, 3) // 只取前3个例子
        });
      }
    }
    
    // 如果找到 Firebase 相关代码
    if (foundPatterns.length > 0) {
      scanResults.filesWithFirebase++;
      
      // 分析具体的行
      const lines = content.split('\n');
      const firebaseLines = [];
      
      lines.forEach((line, index) => {
        for (const pattern of firebasePatterns) {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(line)) {
            firebaseLines.push({
              lineNumber: index + 1,
              content: line.trim(),
              pattern: pattern
            });
          }
        }
      });
      
      scanResults.firebaseReferences.push({
        file: relativePath,
        patterns: foundPatterns,
        lines: firebaseLines,
        totalLines: lines.length,
        firebaseLineCount: firebaseLines.length
      });
    }
  } catch (error) {
    console.error(`扫描文件错误 ${filePath}:`, error.message);
  }
}

// 生成统计摘要
function generateSummary() {
  const summary = {
    byFileType: {},
    byPattern: {},
    mostAffectedFiles: [],
    criticalFiles: []
  };
  
  // 按文件类型统计
  scanResults.firebaseReferences.forEach(ref => {
    const ext = path.extname(ref.file);
    if (!summary.byFileType[ext]) {
      summary.byFileType[ext] = { count: 0, files: [] };
    }
    summary.byFileType[ext].count++;
    summary.byFileType[ext].files.push(ref.file);
  });
  
  // 按模式统计
  scanResults.firebaseReferences.forEach(ref => {
    ref.patterns.forEach(p => {
      if (!summary.byPattern[p.pattern]) {
        summary.byPattern[p.pattern] = { count: 0, files: [] };
      }
      summary.byPattern[p.pattern].count += p.matches;
      summary.byPattern[p.pattern].files.push(ref.file);
    });
  });
  
  // 最受影响的文件 (按 Firebase 行数排序)
  summary.mostAffectedFiles = scanResults.firebaseReferences
    .sort((a, b) => b.firebaseLineCount - a.firebaseLineCount)
    .slice(0, 10);
  
  // 关键文件 (contexts, 主要页面)
  summary.criticalFiles = scanResults.firebaseReferences.filter(ref => 
    ref.file.includes('context') || 
    ref.file.includes('app/') ||
    ref.file.includes('lib/')
  );
  
  scanResults.summary = summary;
}

// 输出报告
function printReport() {
  console.log('\n🔥 FIREBASE 残留代码扫描报告');
  console.log('=' * 50);
  
  console.log(`\n📊 总体统计:`);
  console.log(`   总文件数: ${scanResults.totalFiles}`);
  console.log(`   包含Firebase的文件: ${scanResults.filesWithFirebase}`);
  console.log(`   影响比例: ${((scanResults.filesWithFirebase / scanResults.totalFiles) * 100).toFixed(1)}%`);
  
  if (scanResults.filesWithFirebase === 0) {
    console.log('\n✅ 恭喜！没有发现 Firebase 残留代码。');
    return;
  }
  
  console.log(`\n🔍 按文件类型分布:`);
  Object.entries(scanResults.summary.byFileType).forEach(([ext, data]) => {
    console.log(`   ${ext}: ${data.count} 个文件`);
  });
  
  console.log(`\n📈 最常见的 Firebase 模式:`);
  const sortedPatterns = Object.entries(scanResults.summary.byPattern)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 10);
  
  sortedPatterns.forEach(([pattern, data]) => {
    console.log(`   ${pattern}: ${data.count} 次`);
  });
  
  console.log(`\n🚨 最受影响的文件 (前10个):`);
  scanResults.summary.mostAffectedFiles.forEach((ref, index) => {
    console.log(`   ${index + 1}. ${ref.file} (${ref.firebaseLineCount} 行Firebase代码)`);
  });
  
  console.log(`\n⚠️  关键文件需要优先处理:`);
  scanResults.summary.criticalFiles.forEach(ref => {
    console.log(`   📁 ${ref.file} (${ref.firebaseLineCount} 行Firebase代码)`);
    ref.patterns.forEach(p => {
      console.log(`      - ${p.pattern}: ${p.matches} 次`);
    });
  });
  
  console.log(`\n🔧 推荐处理顺序:`);
  console.log(`   1. Context 文件 (数据层)`);
  console.log(`   2. Page 组件 (视图层)`);
  console.log(`   3. 工具和配置文件`);
  console.log(`   4. 清理和优化`);
}

// 生成详细报告文件
function generateDetailedReport() {
  const reportContent = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: scanResults.totalFiles,
      filesWithFirebase: scanResults.filesWithFirebase,
      affectedPercentage: ((scanResults.filesWithFirebase / scanResults.totalFiles) * 100).toFixed(1)
    },
    statistics: scanResults.summary,
    detailedFindings: scanResults.firebaseReferences.map(ref => ({
      file: ref.file,
      firebaseLineCount: ref.firebaseLineCount,
      totalLines: ref.totalLines,
      patterns: ref.patterns,
      exampleLines: ref.lines.slice(0, 5) // 只保留前5行作为例子
    }))
  };
  
  fs.writeFileSync(
    path.join(projectRoot, 'firebase-scan-report.json'), 
    JSON.stringify(reportContent, null, 2),
    'utf8'
  );
  
  console.log(`\n📄 详细报告已保存到: firebase-scan-report.json`);
}

// 主执行函数
function main() {
  console.log('🔍 开始扫描 Firebase 残留代码...');
  console.log(`📂 扫描目录: ${srcDir}`);
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src 目录不存在');
    process.exit(1);
  }
  
  try {
    scanDirectory(srcDir);
    generateSummary();
    printReport();
    generateDetailedReport();
    
    // 提供后续建议
    if (scanResults.filesWithFirebase > 0) {
      console.log(`\n🎯 下一步建议:`);
      console.log(`   1. 运行 'npm run firebase:cleanup' 开始清理`);
      console.log(`   2. 优先处理 Context 文件`);
      console.log(`   3. 逐步迁移到适配器系统`);
      console.log(`   4. 测试每个迁移的组件`);
    }
    
  } catch (error) {
    console.error('❌ 扫描过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行扫描
if (require.main === module) {
  main();
}

module.exports = {
  scanDirectory,
  scanFile,
  generateSummary,
  scanResults
};
