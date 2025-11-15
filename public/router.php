<?php
/**
 * 路由处理文件（用于PHP内置服务器）
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 处理admin目录下的静态资源（CSS、JS、图片等）
if (strpos($uri, '/admin') === 0) {
    $adminResource = __DIR__ . '/../admin' . substr($uri, 6); // 移除 /admin 前缀
    if (file_exists($adminResource) && !is_dir($adminResource)) {
        // 设置正确的Content-Type
        $ext = pathinfo($adminResource, PATHINFO_EXTENSION);
        $mimeTypes = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'html' => 'text/html',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon'
        ];
        $mimeType = $mimeTypes[$ext] ?? mime_content_type($adminResource);
        header('Content-Type: ' . $mimeType);
        readfile($adminResource);
        return true;
    }
    // 如果是访问 /admin 或 /admin/，返回index.html
    if ($uri === '/admin' || $uri === '/admin/') {
        $adminFile = __DIR__ . '/../admin/index.html';
        if (file_exists($adminFile)) {
            header('Content-Type: text/html; charset=utf-8');
            readfile($adminFile);
            return true;
        }
    }
}

// 静态文件直接返回
if (file_exists(__DIR__ . $uri) && !is_dir(__DIR__ . $uri)) {
    return false;
}

// API请求
if (strpos($uri, '/api') === 0) {
    require_once __DIR__ . '/../api/index.php';
    return true;
}

// 上传文件
if (strpos($uri, '/uploads') === 0) {
    $file = __DIR__ . $uri;
    if (file_exists($file)) {
        $mimeType = mime_content_type($file);
        header('Content-Type: ' . $mimeType);
        readfile($file);
        return true;
    }
}

// 默认返回404
http_response_code(404);
echo '404 Not Found';
return true;

