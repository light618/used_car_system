<?php
/**
 * 门店模型
 */

namespace App\Models;

use App\Models\Database;

class Store
{
    private $db;
    
    public function __construct()
    {
        $this->db = Database::getInstance();
    }
    
    /**
     * 获取门店列表
     */
    public function getList($page = 1, $limit = 20, $keyword = '')
    {
        $offset = ($page - 1) * $limit;
        $where = "WHERE is_deleted = 0";
        
        if ($keyword) {
            $where .= " AND (store_name LIKE '%{$keyword}%' OR store_code LIKE '%{$keyword}%')";
        }
        
        $sql = "SELECT * FROM uc_stores {$where} ORDER BY create_time DESC LIMIT {$limit} OFFSET {$offset}";
        $list = $this->db->query($sql);
        
        $countSql = "SELECT COUNT(*) as total FROM uc_stores {$where}";
        $total = $this->db->queryOne($countSql)['total'];
        
        return ['list' => $list, 'total' => $total];
    }
    
    /**
     * 获取门店详情
     */
    public function getById($id)
    {
        $sql = "SELECT * FROM uc_stores WHERE id = ? AND is_deleted = 0";
        return $this->db->queryOne($sql, [$id]);
    }
    
    /**
     * 根据编码获取门店
     */
    public function getByCode($code)
    {
        $sql = "SELECT * FROM uc_stores WHERE store_code = ? AND is_deleted = 0";
        return $this->db->queryOne($sql, [$code]);
    }
    
    /**
     * 创建门店
     */
    public function create($data)
    {
        $sql = "INSERT INTO uc_stores (store_code, store_name, store_address, store_phone, store_description, remark, create_time, update_time) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        return $this->db->insert($sql, [
            $data['store_code'],
            $data['store_name'],
            $data['store_address'],
            $data['store_phone'],
            $data['store_description'] ?? '',
            $data['remark'] ?? '',
            time(),
            time()
        ]);
    }
    
    /**
     * 更新门店
     */
    public function update($id, $data)
    {
        $sql = "UPDATE uc_stores SET store_name = ?, store_address = ?, store_phone = ?, store_description = ?, remark = ?, update_time = ? WHERE id = ?";
        return $this->db->execute($sql, [
            $data['store_name'],
            $data['store_address'],
            $data['store_phone'],
            $data['store_description'] ?? '',
            $data['remark'] ?? '',
            time(),
            $id
        ]);
    }
    
    /**
     * 删除门店（软删除）
     */
    public function delete($id)
    {
        $sql = "UPDATE uc_stores SET is_deleted = 1, update_time = ? WHERE id = ?";
        return $this->db->execute($sql, [time(), $id]);
    }
    
    /**
     * 获取所有门店（用于下拉选择）
     */
    public function getAll()
    {
        $sql = "SELECT id, store_code, store_name FROM uc_stores WHERE is_deleted = 0 AND status = 1 ORDER BY create_time DESC";
        return $this->db->query($sql);
    }
}

