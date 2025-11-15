<?php
/**
 * 用户管理控制器
 */

namespace App\Controllers;

use App\Models\User;
use App\Middleware\Auth;
use App\Utils\Response;
use App\Utils\Request;

class UserController
{
    /**
     * 修改密码
     */
    public function changePassword()
    {
        $payload = Auth::verifyToken();
        
        $data = Request::getData();
        $oldPassword = trim($data['old_password'] ?? '');
        $newPassword = trim($data['new_password'] ?? '');
        
        if (!$oldPassword || !$newPassword) {
            Response::error('原密码和新密码不能为空');
        }
        
        // 验证密码长度（只需6位）
        if (strlen($newPassword) < 6) {
            Response::error('新密码至少需要6位');
        }
        
        $userModel = new User();
        $user = $userModel->getById($payload['user_id']);
        
        if (!$user) {
            Response::error('用户不存在');
        }
        
        // 获取完整用户信息（包含密码）
        $fullUser = $userModel->getByUsername($user['username']);
        
        // 验证原密码
        if (!$userModel->verifyPassword($oldPassword, $fullUser['password'])) {
            Response::error('原密码错误');
        }
        
        // 更新密码
        $result = $userModel->updatePassword($payload['user_id'], $newPassword);
        
        if ($result) {
            Response::success([], '密码修改成功');
        } else {
            Response::error('密码修改失败');
        }
    }
    
    /**
     * 重置密码（总部功能）
     */
    public function resetPassword()
    {
        Auth::checkRole(['headquarters_admin']);
        
        $data = Request::getData();
        $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
        $newPassword = trim($data['new_password'] ?? '');
        
        if (!$userId || !$newPassword) {
            Response::error('用户ID和新密码不能为空');
        }
        
        // 验证密码长度（只需6位）
        if (strlen($newPassword) < 6) {
            Response::error('新密码至少需要6位');
        }
        
        $userModel = new User();
        $result = $userModel->updatePassword($userId, $newPassword);
        
        if ($result) {
            Response::success(['password' => $newPassword], '密码重置成功');
        } else {
            Response::error('密码重置失败');
        }
    }
}
