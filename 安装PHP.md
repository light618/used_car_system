# PHP安装指南

主公，系统需要PHP才能运行。请先安装PHP。

## macOS安装PHP

### 方法一：使用Homebrew（推荐）
```bash
brew install php
```

安装完成后，PHP通常位于：
- `/opt/homebrew/bin/php` (Apple Silicon Mac)
- `/usr/local/bin/php` (Intel Mac)

### 方法二：使用MAMP
如果您使用MAMP，PHP路径通常是：
```
/Applications/MAMP/bin/php/php8.x.x/bin/php
```

## 安装后启动服务器

安装PHP后，执行：
```bash
cd /Users/yiche/used-car-system
bash 启动服务器.sh
```

或者手动启动：
```bash
php -S localhost:8080 -t public router.php
```

## 验证PHP安装

```bash
php --version
```

应该显示PHP版本信息。

