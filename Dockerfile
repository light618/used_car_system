# 使用官方PHP 8.2镜像
FROM php:8.2-cli

# 安装系统依赖与必要的 PHP 扩展
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libonig-dev \
       libjpeg62-turbo-dev \
       libpng-dev \
       libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql mbstring gd \
    && rm -rf /var/lib/apt/lists/*

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

# 启动脚本
RUN chmod +x /app/start.sh

# 启动命令
CMD ["/app/start.sh"]

