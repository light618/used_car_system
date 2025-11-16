#!/bin/bash
# 连接GitHub仓库脚本

echo "=========================================="
echo "  连接GitHub仓库"
echo "=========================================="
echo ""

# 检查是否已有远程仓库
if git remote get-url origin &>/dev/null; then
    echo "当前远程仓库地址："
    git remote -v
    echo ""
    read -p "是否要更新远程仓库地址？(y/n): " update
    if [ "$update" != "y" ]; then
        echo "已取消"
        exit 0
    fi
    git remote remove origin
fi

echo "请输入您的GitHub用户名："
read github_username

if [ -z "$github_username" ]; then
    echo "❌ 错误：GitHub用户名不能为空"
    exit 1
fi

# 添加远程仓库
git remote add origin "https://github.com/${github_username}/used_car_system.git"

echo ""
echo "✅ 远程仓库已添加："
git remote -v

echo ""
echo "正在推送代码到GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ 代码已成功推送到GitHub！"
    echo ""
    echo "📌 下一步："
    echo "1. 访问 https://railway.app"
    echo "2. 登录并创建新项目"
    echo "3. 选择 'Deploy from GitHub repo'"
    echo "4. 选择您的仓库: ${github_username}/used_car_system"
    echo "=========================================="
else
    echo ""
    echo "❌ 推送失败，请检查："
    echo "1. GitHub仓库地址是否正确"
    echo "2. 是否有推送权限"
    echo "3. 是否已登录GitHub"
fi

