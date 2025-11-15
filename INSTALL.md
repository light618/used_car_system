# 安装部署指南

主公，这是系统的安装部署指南，请按照步骤操作。

## 环境要求

- PHP >= 7.4
- MySQL >= 5.7
- Apache/Nginx
- Composer（可选）

## 安装步骤

### 1. 克隆项目

```bash
cd /path/to/your/project
git clone [项目地址] used-car-system
cd used-car-system
```

### 2. 配置数据库

1. 创建数据库：
```sql
CREATE DATABASE used_car_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 修改配置文件 `config/database.php`：
```php
'hostname' => '127.0.0.1',
'database' => 'used_car_system',
'username' => 'root',
'password' => 'your_password',
```

3. 导入数据库表：
```bash
mysql -u root -p used_car_system < database/migrations/001_create_users_table.sql
mysql -u root -p used_car_system < database/migrations/002_create_cars_table.sql
mysql -u root -p used_car_system < database/migrations/003_create_orders_table.sql
mysql -u root -p used_car_system < database/migrations/004_create_collections_table.sql
```

### 3. 配置微信小程序

修改 `config/app.php`：
```php
'wechat' => [
    'appid' => 'your-miniprogram-appid',
    'secret' => 'your-miniprogram-secret',
],
```

### 4. 配置Web服务器

#### Apache配置

在 `httpd.conf` 或虚拟主机配置中添加：
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/used-car-system
    
    <Directory /path/to/used-car-system>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/used-car-system;
    index index.php;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 5. 设置文件权限

```bash
chmod -R 755 /path/to/used-car-system
chmod -R 777 public/uploads
```

### 6. 测试访问

访问：`http://your-domain.com/api/index.php`

应该返回JSON格式的响应。

## 开发说明

### API接口

所有API接口统一入口：`/api/index.php`

接口列表：
- `/api/car/list` - 车辆列表
- `/api/car/detail` - 车辆详情
- `/api/car/create` - 发布车辆
- `/api/user/login` - 用户登录
- `/api/user/info` - 用户信息

### 目录说明

- `api/` - API接口代码
- `admin/` - 后台管理代码
- `config/` - 配置文件
- `database/` - 数据库文件
- `public/` - 公共资源

## 常见问题

### 1. 数据库连接失败

检查 `config/database.php` 中的配置是否正确。

### 2. 微信登录失败

检查 `config/app.php` 中的微信配置是否正确。

### 3. 文件上传失败

检查 `public/uploads` 目录权限是否为 777。

## 下一步

主公，系统基础框架已搭建完成，接下来可以：
1. 完善API接口逻辑
2. 开发后台管理界面
3. 开发微信小程序前端
4. 添加更多功能模块

如有问题，随时吩咐！

