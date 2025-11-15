#!/bin/bash
# 准备部署到Railway的脚本
# 主公，运行此脚本可以快速准备部署

echo "=========================================="
echo "  赵国第一科技官 - Railway部署准备脚本"
echo "=========================================="
echo ""

# 检查是否在项目根目录
if [ ! -f "composer.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

echo "📦 步骤1: 初始化Git仓库..."
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git仓库已初始化"
else
    echo "✅ Git仓库已存在"
fi

echo ""
echo "📝 步骤2: 检查配置文件..."
if [ -f "railway.toml" ]; then
    echo "✅ railway.toml 已存在"
else
    echo "❌ 错误：railway.toml 不存在"
    exit 1
fi

if [ -f "Procfile" ]; then
    echo "✅ Procfile 已存在"
else
    echo "❌ 错误：Procfile 不存在"
    exit 1
fi

echo ""
echo "📋 步骤3: 检查必要文件..."
files=("config/database.php" "public/router.php" "admin/index.html")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ 错误：$file 不存在"
        exit 1
    fi
done

echo ""
echo "🗄️  步骤4: 检查数据库SQL文件..."
if [ -f "database/schema.sql" ]; then
    echo "✅ database/schema.sql 存在"
else
    echo "⚠️  警告：database/schema.sql 不存在，请确保数据库已初始化"
fi

echo ""
echo "📊 步骤5: 显示当前Git状态..."
git status --short

echo ""
echo "=========================================="
echo "✅ 部署准备检查完成！"
echo ""
echo "📌 下一步操作："
echo "1. 检查并提交所有更改："
echo "   git add ."
echo "   git commit -m '准备部署到Railway - 第一版完成'"
echo ""
echo "2. 添加远程仓库（如果还没有）："
echo "   git remote add origin <您的GitHub仓库地址>"
echo ""
echo "3. 推送到远程仓库："
echo "   git push -u origin main"
echo ""
echo "4. 在Railway创建项目并连接GitHub仓库"
echo ""
echo "5. 在Railway添加MySQL数据库服务"
echo ""
echo "6. 执行 database/schema.sql 初始化数据库"
echo ""
echo "=========================================="
echo "主公，一切准备就绪！可以开始部署了！🎉"

