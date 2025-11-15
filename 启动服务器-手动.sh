#!/bin/bash
# 手动启动服务器脚本

cd "$(dirname "$0")"

echo "正在查找PHP..."
PHP_CMD=""

# 尝试不同的PHP路径
for path in \
    "$(which php 2>/dev/null)" \
    "/opt/homebrew/bin/php" \
    "/usr/local/bin/php" \
    "/usr/bin/php" \
    "/Applications/MAMP/bin/php/php8.2.0/bin/php" \
    "/Applications/MAMP/bin/php/php8.1.0/bin/php" \
    "/Applications/MAMP/bin/php/php8.0.0/bin/php"
do
    if [ -f "$path" ] && [ -x "$path" ]; then
        PHP_CMD="$path"
        echo "✅ 找到PHP: $PHP_CMD"
        $PHP_CMD --version | head -1
        break
    fi
done

if [ -z "$PHP_CMD" ]; then
    echo "❌ 未找到PHP！"
    echo ""
    echo "请先安装PHP："
    echo "  brew install php"
    echo ""
    echo "或者如果您使用MAMP，请手动指定PHP路径"
    exit 1
fi

# 检查端口
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "端口8080已被占用，正在停止..."
    kill -9 $(lsof -ti:8080) 2>/dev/null
    sleep 2
fi

echo ""
echo "🚀 正在启动服务器..."
echo "📱 访问地址：http://localhost:8080/admin/index.html"
echo "🔐 登录账号：admin / admin123"
echo "⏹️  按 Ctrl+C 停止服务器"
echo ""

$PHP_CMD -S localhost:8080 -t public router.php
