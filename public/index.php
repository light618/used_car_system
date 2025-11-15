<?php
/**
 * 前端入口文件
 */
// 如果是访问根路径，跳转到管理界面
if ($_SERVER['REQUEST_URI'] === '/' || $_SERVER['REQUEST_URI'] === '/index.php') {
    header('Location: /admin/index.html');
    exit;
}
// 否则交给API处理
require_once __DIR__ . '/../api/index.php';

