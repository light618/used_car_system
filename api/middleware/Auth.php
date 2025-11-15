<?php
/**
 * 认证中间件
 */

namespace App\Middleware;

use App\Utils\Jwt;
use App\Utils\Response;

class Auth
{
    /**
     * 验证token
     */
    public static function verifyToken()
    {
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? '';
        
        if (!$token) {
            Response::error('未登录', 401);
        }
        
        // 移除 Bearer 前缀
        if (strpos($token, 'Bearer ') === 0) {
            $token = substr($token, 7);
        }
        
        $payload = Jwt::decode($token);
        if (!$payload) {
            Response::error('Token无效或已过期', 401);
        }
        
        return $payload;
    }
    
    /**
     * 检查角色权限
     */
    public static function checkRole($allowedRoles)
    {
        $payload = self::verifyToken();
        $userRole = $payload['role'] ?? '';
        
        if (!in_array($userRole, $allowedRoles)) {
            Response::error('权限不足', 403);
        }
        
        return $payload;
    }
}

