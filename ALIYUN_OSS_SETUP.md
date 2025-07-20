# 阿里云OSS配置指南

## 1. 注册阿里云账号
1. 访问：https://www.aliyun.com
2. 点击"免费注册"
3. 完成手机号验证和实名认证

## 2. 开通OSS服务
1. 登录阿里云控制台
2. 搜索"对象存储OSS"或访问：https://oss.console.aliyun.com
3. 点击"立即开通"
4. 选择"按量付费"（可享受免费额度）

## 3. 创建存储桶(Bucket)
1. 进入OSS控制台
2. 点击"创建Bucket"
3. 填写配置：
   - Bucket名称: hospitakeaway-files-[您的标识]
   - 地域: 选择离您最近的区域（如华东1-杭州）
   - 存储类型: 标准存储
   - 读写权限: 私有（推荐）
   - 服务端加密: 关闭（可选）

## 4. 获取访问密钥
1. 点击右上角头像 → AccessKey管理
2. 创建AccessKey（建议使用子用户）
3. 记录AccessKey ID和AccessKey Secret

## 5. 配置跨域规则（CORS）
1. 进入您的Bucket管理页面
2. 选择"权限管理" → "跨域设置"
3. 添加跨域规则：
   - 来源: * （开发环境）或您的域名
   - 允许Methods: GET, POST, PUT, DELETE, HEAD
   - 允许Headers: *
   - 暴露Headers: ETag, x-oss-request-id

## 6. 费用估算（开发阶段）
- 存储100MB文件: ¥0.02/月
- 1000次上传请求: ¥0.002
- 下载1GB: ¥0.50
- **总计**: 每月约¥1-5（远低于免费额度）
