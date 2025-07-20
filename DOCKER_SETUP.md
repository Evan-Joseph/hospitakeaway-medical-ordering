# Docker 镜像源配置指南

## 方法1: Docker Desktop 界面配置

1. 打开 Docker Desktop
2. 点击右上角的设置图标 (齿轮)
3. 选择 "Docker Engine"
4. 在配置文件中添加国内镜像源

将以下配置替换到您的 Docker Engine 配置中：

```json
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerhub.azk8s.cn",
    "https://reg-mirror.qiniu.com",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "insecure-registries": [],
  "debug": false,
  "experimental": false,
  "features": {
    "buildkit": true
  }
}
```

## 方法2: 命令行配置 (备选)

如果需要手动配置，可以创建或编辑以下文件：

**Windows 路径**: `%USERPROFILE%\.docker\daemon.json`

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerhub.azk8s.cn",
    "https://reg-mirror.qiniu.com"
  ]
}
```

## 常用国内镜像源

- DaoCloud: https://docker.m.daocloud.io
- 阿里云: https://dockerhub.azk8s.cn  
- 网易云: https://hub-mirror.c.163.com
- 百度云: https://mirror.baidubce.com
- 七牛云: https://reg-mirror.qiniu.com

## 验证配置

配置完成后：
1. 重启 Docker Desktop
2. 运行测试命令验证镜像源是否生效
