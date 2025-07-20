# MongoDB 环境准备指南

## 选项1: Docker 部署 (推荐)
```bash
# 1. 安装 Docker Desktop
# 下载地址: https://www.docker.com/products/docker-desktop

# 2. 启动 MongoDB 容器
docker run -d --name hospitakeaway-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  -e MONGO_INITDB_DATABASE=hospitakeaway \
  -v mongo-data:/data/db \
  mongo:7.0

# 3. 验证连接
docker exec -it hospitakeaway-mongo mongosh
```

## 选项2: 本地安装
```bash
# Windows 安装
# 1. 下载: https://www.mongodb.com/try/download/community
# 2. 选择 Windows x64, MSI 格式
# 3. 安装时选择 "Complete" 安装
# 4. 启动 MongoDB 服务

# 启动服务
net start MongoDB

# 连接测试
mongosh
```

## 选项3: 云数据库 (生产推荐)
- 阿里云 MongoDB: https://www.aliyun.com/product/mongodb
- 腾讯云 MongoDB: https://cloud.tencent.com/product/mongodb
- 华为云 DocumentDB: https://www.huaweicloud.com/product/documentdb.html
