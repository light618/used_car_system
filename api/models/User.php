<?php
/**
 * 用户模型
 */

namespace App\Models;

use App\Models\Database;

class User
{
    private $db;
    
    public function __construct()
    {
        $this->db = Database::getInstance();
    }
    
    /**
     * 根据用户名获取用户
     */
    public function getByUsername($username)
    {
        $sql = "SELECT * FROM uc_users WHERE username = ? AND status = 1";
        return $this->db->queryOne($sql, [$username]);
    }
    
    /**
     * 根据ID获取用户
     */
    public function getById($id)
    {
        $sql = "SELECT id, username, real_name, role, store_id, status FROM uc_users WHERE id = ? AND status = 1";
        return $this->db->queryOne($sql, [$id]);
    }
    
    /**
     * 创建用户
     */
    public function create($data)
    {
        $sql = "INSERT INTO uc_users (username, password, real_name, role, store_id, create_time, update_time) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        return $this->db->insert($sql, [
            $data['username'],
            password_hash($data['password'], PASSWORD_DEFAULT),
            $data['real_name'] ?? '',
            $data['role'],
            $data['store_id'] ?? 0,
            time(),
            time()
        ]);
    }
    
    /**
     * 更新密码
     */
    public function updatePassword($id, $newPassword)
    {
        $sql = "UPDATE uc_users SET password = ?, update_time = ? WHERE id = ?";
        return $this->db->execute($sql, [
            password_hash($newPassword, PASSWORD_DEFAULT),
            time(),
            $id
        ]);
    }
    
    /**
     * 验证密码
     */
    public function verifyPassword($password, $hash)
    {
        return password_verify($password, $hash);
    }
    
    /**
     * 更新最后登录时间
     */
    public function updateLastLoginTime($id)
    {
        $sql = "UPDATE uc_users SET last_login_time = ? WHERE id = ?";
        return $this->db->execute($sql, [time(), $id]);
    }
    
    /**
     * 获取门店用户列表
     */
    public function getStoreUsers($storeId)
    {
        $sql = "SELECT id, username, real_name, role, status, create_time FROM uc_users WHERE store_id = ? AND status = 1 ORDER BY create_time DESC";
        return $this->db->query($sql, [$storeId]);
    }
}

