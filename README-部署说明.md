# 集团二手车管理系统 - 部署说明

主公，这是完整的部署说明文档。

## 一、环境要求

- PHP >= 7.4
- MySQL >= 5.7
- Apache/Nginx
- 开启PDO扩展
- 开启JSON扩展

## 二、部署步骤

### 1. 上传文件

将所有文件上传到服务器，建议目录结构：
```
/var/www/used-car-system/
├── api/
├── admin/
├── config/
├── database/
├── public/
└── ...
```

### 2. 配置数据库

1. 创建数据库：
```sql
CREATE DATABASE used_car_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入数据库表结构：
```bash
mysql -u root -p used_car_system < database/schema.sql
```

3. 修改配置文件 `config/database.php`：
```php
'hostname' => '127.0.0.1',
'database' => 'used_car_system',
'username' => 'root',
'password' => 'your_password',
```

### 3. 配置Web服务器

#### Apache配置

在 `httpd.conf` 或虚拟主机配置中添加：
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/used-car-system/public
    
    <Directory /var/www/used-car-system/public>
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
    root /var/www/used-car-system/public;
    index index.php;
    
    location / {
        try_files $uri $uri/ /api/index.php?$query_string;
    }
    
    location /admin {
        try_files $uri $uri/ /admin/index.html;
    }
    
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 4. 设置文件权限

```bash
chmod -R 755 /var/www/used-car-system
chmod -R 777 public/uploads
```

### 5. 配置API地址

修改 `admin/js/api.js` 中的 `baseURL`：
```javascript
baseURL: '/api',  // 或 'http://your-domain.com/api'
```

## 三、默认账号

系统初始化后会创建一个默认总部管理员账号：
- 用户名：`admin`
- 密码：`admin123`

**注意**：首次登录后请立即修改密码！

## 四、功能测试

### 1. 登录测试
访问：`http://your-domain.com/admin/index.html`
使用默认账号登录

### 2. 创建门店
- 登录后进入"门店管理"
- 点击"新增门店"
- 填写门店信息
- 创建成功后会生成两个默认账号：
  - 录入员：`门店编码_luru` / `123456`
  - 管理员：`门店编码_admin` / `123456`

### 3. 录入车源
- 使用门店录入员账号登录
- 进入"新增车源"
- 填写车源信息并上传图片
- 提交审核

### 4. 审核车源
- 使用门店管理员账号登录
- 进入"待审核车源"
- 查看详情并审核

### 5. 授权车源
- 使用总部管理员账号登录
- 查看已审核通过的车源
- 点击"授权"按钮
- 选择目标门店进行授权

## 五、常见问题

### 1. 数据库连接失败
- 检查 `config/database.php` 配置
- 确认数据库服务已启动
- 检查数据库用户权限

### 2. 图片上传失败
- 检查 `public/uploads` 目录权限（应为777）
- 检查PHP上传文件大小限制
- 检查Web服务器配置

### 3. API请求失败
- 检查API路由配置
- 检查CORS跨域设置
- 查看浏览器控制台错误信息

### 4. Token过期
- Token有效期为7天
- 过期后需要重新登录
- 可在 `api/utils/Jwt.php` 中修改过期时间

## 六、安全建议

1. **修改默认密码**：首次登录后立即修改所有默认密码
2. **数据库安全**：使用强密码，限制数据库访问IP
3. **文件权限**：确保敏感文件权限设置正确
4. **HTTPS**：生产环境建议使用HTTPS
5. **定期备份**：定期备份数据库和上传的文件

## 七、技术支持

主公，如有问题随时吩咐！

---

**系统已就绪，可以开始使用了！** 🎉

