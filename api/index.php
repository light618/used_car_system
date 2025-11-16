<?php
/**
 * API入口文件
 */

// 设置时区

date_default_timezone_set('Asia/Shanghai');

// 开启错误报告（开发环境）
error_reporting(E_ALL);
ini_set('display_errors', '1');

// 设置字符编码
header('Content-Type: application/json; charset=utf-8');

// 允许跨域
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 处理OPTIONS请求
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// 引入配置文件
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/app.php';

// 引入核心类
require_once __DIR__ . '/models/Database.php';
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/utils/Jwt.php';
require_once __DIR__ . '/utils/Request.php';
require_once __DIR__ . '/middleware/Auth.php';

// 引入模型
require_once __DIR__ . '/models/Store.php';
require_once __DIR__ . '/models/User.php';
require_once __DIR__ . '/models/Car.php';
require_once __DIR__ . '/models/CarImage.php';
require_once __DIR__ . '/models/CarAuthorization.php';

// 引入控制器
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/StoreController.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/CarController.php';
require_once __DIR__ . '/controllers/UploadController.php';
require_once __DIR__ . '/controllers/CaptchaController.php';

// 路由处理
$uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// 移除查询字符串
$path = parse_url($uri, PHP_URL_PATH);

// 移除/api前缀
$path = str_replace('/api', '', $path);
if (empty($path) || $path == '/') {
    $path = '/index';
}

// 路由映射
$routes = [
    // 认证相关
    '/auth/login' => ['AuthController', 'login'],
    '/auth/me' => ['AuthController', 'me'],
    '/auth/captcha' => ['CaptchaController', 'generate'],
    
    // 门店管理
    '/store/list' => ['StoreController', 'list'],
    '/store/detail' => ['StoreController', 'detail'],
    '/store/create' => ['StoreController', 'create'],
    '/store/update' => ['StoreController', 'update'],
    '/store/delete' => ['StoreController', 'delete'],
    '/store/all' => ['StoreController', 'all'],
    
    // 用户管理
    '/user/change-password' => ['UserController', 'changePassword'],
    '/user/reset-password' => ['UserController', 'resetPassword'],
    
    // 车源管理
    '/car/list' => ['CarController', 'list'],
    '/car/detail' => ['CarController', 'detail'],
    '/car/create' => ['CarController', 'create'],
    '/car/update' => ['CarController', 'update'],
    '/car/audit' => ['CarController', 'audit'],
    '/car/authorize' => ['CarController', 'authorize'],
    '/car/revoke' => ['CarController', 'revoke'],
    '/car/sell' => ['CarController', 'sell'],
    
    // 文件上传
    '/upload/image' => ['UploadController', 'image'],
];

// 查找路由
if (isset($routes[$path])) {
    $route = $routes[$path];
    $controllerName = $route[0];
    $actionName = $route[1];
    
    $controllerClass = "App\\Controllers\\{$controllerName}";
    if (class_exists($controllerClass)) {
        $controller = new $controllerClass();
        if (method_exists($controller, $actionName)) {
            try {
                $controller->$actionName();
            } catch (\Exception $e) {
                // 验证码接口直接输出，不返回JSON
                if ($path === '/auth/captcha') {
                    http_response_code(500);
                    exit;
                }
                \App\Utils\Response::error($e->getMessage(), 500);
            }
        } else {
            \App\Utils\Response::error('方法不存在', 404);
        }
    } else {
        \App\Utils\Response::error('控制器不存在', 404);
    }
} else {
    \App\Utils\Response::error('路由不存在: ' . $path, 404);
}
