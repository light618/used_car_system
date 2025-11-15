#!/bin/bash
# 启动PHP内置服务器

cd "$(dirname "$0")"

# 检查PHP是否安装
if ! command -v php &> /dev/null; then
    echo "错误：未找到PHP，请先安装PHP"
    echo "macOS安装：brew install php"
    exit 1
fi

# 检查端口是否被占用
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "端口8080已被占用，正在停止..."
    pkill -f "php -S localhost:8080"
    sleep 2
fi

# 启动服务器
echo "正在启动PHP服务器..."
echo "访问地址：http://localhost:8080/admin/index.html"
echo "按 Ctrl+C 停止服务器"
echo ""

php -S localhost:8080 -t public router.php

