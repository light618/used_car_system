# 二手车管理系统 - Railway部署指南

主公，这是完整的Railway部署指南，臣已为您准备好一切！

## 🚀 部署步骤

### 第一步：准备Git仓库

主公，请确保项目已推送到Git仓库（GitHub、GitLab等）：

```bash
git init
git add .
git commit -m "准备部署到Railway"
git remote add origin <您的仓库地址>
git push -u origin main
```

### 第二步：在Railway创建项目

1. 访问 [Railway.app](https://railway.app)
2. 使用GitHub账号登录
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择您的仓库

### 第三步：配置环境变量

主公，在Railway项目设置中添加以下环境变量：

#### 数据库配置（如果使用Railway的MySQL服务）
```
DB_HOST=您的数据库地址
DB_NAME=used_car_system
DB_USER=您的数据库用户名
DB_PASSWORD=您的数据库密码
DB_PORT=3306
```

#### 应用配置
```
APP_ENV=production
APP_DEBUG=false
```

### 第四步：添加MySQL数据库服务（如需要）

1. 在Railway项目中点击 "New"
2. 选择 "Database" -> "MySQL"
3. Railway会自动创建数据库并设置环境变量：
   - `MYSQL_HOST`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_PORT`

### 第五步：配置数据库连接

主公，需要修改 `config/database.php` 以读取Railway的环境变量：

```php
<?php
return [
    'hostname' => getenv('MYSQL_HOST') ?: '127.0.0.1',
    'database' => getenv('MYSQL_DATABASE') ?: 'used_car_system',
    'username' => getenv('MYSQL_USER') ?: 'root',
    'password' => getenv('MYSQL_PASSWORD') ?: '',
    'port' => getenv('MYSQL_PORT') ?: 3306,
    'charset' => 'utf8mb4'
];
```

### 第六步：初始化数据库

主公，可以通过Railway的数据库控制台执行SQL：

1. 在Railway项目中找到MySQL服务
2. 点击 "Query" 标签
3. 执行 `database/schema.sql` 中的SQL语句

或者使用Railway CLI：

```bash
railway run mysql -h <host> -u <user> -p <database> < database/schema.sql
```

### 第七步：配置上传目录权限

主公，Railway会自动处理文件权限，但需要确保 `public/uploads` 目录存在：

```bash
mkdir -p public/uploads/cars
mkdir -p public/uploads/greenbook
```

### 第八步：部署

主公，Railway会自动检测到 `railway.toml` 和 `Procfile`，并开始部署！

部署完成后，Railway会提供一个 `.railway.app` 域名，主公可以直接访问。

## 📝 重要配置说明

### 1. 端口配置
Railway会自动设置 `$PORT` 环境变量，我们的启动命令已正确配置。

### 2. 静态文件服务
`public/router.php` 已配置好，可以正确处理：
- `/admin/*` - 管理后台
- `/api/*` - API接口
- `/uploads/*` - 上传文件

### 3. 数据库迁移
主公，首次部署后需要执行数据库迁移，可以通过Railway的数据库控制台执行。

## 🔧 故障排查

### 问题1：部署失败
- 检查 `composer.json` 是否正确
- 检查PHP版本是否 >= 7.4
- 查看Railway的构建日志

### 问题2：数据库连接失败
- 检查环境变量是否正确设置
- 确认数据库服务已启动
- 检查 `config/database.php` 配置

### 问题3：静态文件404
- 检查 `public/router.php` 路由配置
- 确认文件路径正确

### 问题4：上传文件失败
- 检查 `public/uploads` 目录权限
- 确认目录存在

## 🎉 部署完成

主公，部署成功后：
1. 访问 `https://您的项目名.railway.app/admin`
2. 使用默认账号登录：
   - 用户名：`admin`
   - 密码：`admin123`
3. 立即修改默认密码！

## 📌 后续优化建议

主公，臣建议：
1. 配置自定义域名（Railway支持）
2. 启用HTTPS（Railway自动提供）
3. 设置环境变量保护敏感信息
4. 配置自动备份数据库

---

**主公，系统已准备就绪，随时可以部署！** 🎊

如有任何问题，臣随时待命！

