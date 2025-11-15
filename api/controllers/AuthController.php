<?php
/**
 * 认证控制器
 */

namespace App\Controllers;

use App\Models\User;
use App\Models\Store;
use App\Utils\Jwt;
use App\Utils\Response;
use App\Utils\Request;

class AuthController
{
    /**
     * 登录
     */
    public function login()
    {
        $data = Request::getData();
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        $captcha = $data['captcha'] ?? '';
        
        if (!$username || !$password) {
            Response::error('用户名和密码不能为空');
        }
        
        // 验证验证码
        if (!\App\Controllers\CaptchaController::verify($captcha)) {
            Response::error('验证码错误');
        }
        
        $userModel = new User();
        $user = $userModel->getByUsername($username);
        
        if (!$user) {
            Response::error('用户名或密码错误');
        }
        
        if (!$userModel->verifyPassword($password, $user['password'])) {
            Response::error('用户名或密码错误');
        }
        
        // 更新最后登录时间
        $userModel->updateLastLoginTime($user['id']);
        
        // 生成token
        $payload = [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'store_id' => $user['store_id'],
            'exp' => time() + 86400 * 7 // 7天过期
        ];
        
        $token = Jwt::encode($payload);
        
        Response::success([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'real_name' => $user['real_name'],
                'role' => $user['role'],
                'store_id' => $user['store_id']
            ]
        ], '登录成功');
    }
    
    /**
     * 获取当前用户信息
     */
    public function me()
    {
        $payload = \App\Middleware\Auth::verifyToken();
        
        $userModel = new User();
        $user = $userModel->getById($payload['user_id']);
        
        if (!$user) {
            Response::error('用户不存在');
        }
        
        // 获取门店信息
        if ($user['store_id'] > 0) {
            $storeModel = new Store();
            $store = $storeModel->getById($user['store_id']);
            $user['store_name'] = $store ? $store['store_name'] : '';
        } else {
            $user['store_name'] = '总部';
        }
        
        // 岗位名称
        $roleMap = [
            'headquarters_admin' => '总部管理员',
            'store_admin' => '门店管理员',
            'store_input' => '录入员'
        ];
        $user['role_name'] = $roleMap[$user['role']] ?? $user['role'];
        
        Response::success($user);
    }
}

