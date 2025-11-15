# 使用官方PHP 8.2镜像
FROM php:8.2-cli

# 安装必要的扩展
RUN docker-php-ext-install pdo pdo_mysql mbstring

# 安装Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 设置工作目录
WORKDIR /app

# 复制composer文件
COPY composer.json composer.lock* ./

# 安装依赖
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 复制项目文件
COPY . .

# 创建上传目录
RUN mkdir -p public/uploads/cars public/uploads/greenbook && \
    chmod -R 777 public/uploads

# 暴露端口
EXPOSE $PORT

# 启动命令
CMD php -S 0.0.0.0:$PORT -t public public/router.php

