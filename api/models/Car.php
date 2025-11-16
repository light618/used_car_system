<?php
/**
 * 车源模型
 */

namespace App\Models;

use App\Models\Database;

class Car
{
    private $db;
    
    public function __construct()
    {
        $this->db = Database::getInstance();
    }
    
    /**
     * 获取车源列表
     */
    public function getList($params = [])
    {
        $page = $params['page'] ?? 1;
        $limit = $params['limit'] ?? 20;
        $offset = ($page - 1) * $limit;
        
        $where = "WHERE 1=1";
        $bindParams = [];
        
        // 门店过滤
        if (isset($params['store_id']) && $params['store_id'] > 0) {
            $where .= " AND c.store_id = ?";
            $bindParams[] = $params['store_id'];
        }
        
        // 录入人员过滤
        if (isset($params['input_id']) && $params['input_id'] > 0) {
            $where .= " AND c.input_user_id = ?";
            $bindParams[] = $params['input_id'];
        }
        
        // 审核状态
        if (isset($params['audit_status']) && $params['audit_status']) {
            $where .= " AND c.audit_status = ?";
            $bindParams[] = $params['audit_status'];
        }
        
        // 车源状态
        if (isset($params['car_status']) && $params['car_status']) {
            $where .= " AND c.car_status = ?";
            $bindParams[] = $params['car_status'];
        }
        
        // 品牌筛选
        if (isset($params['brand']) && $params['brand']) {
            $where .= " AND c.brand = ?";
            $bindParams[] = $params['brand'];
        }
        
        // 关键词搜索
        if (isset($params['keyword']) && $params['keyword']) {
            $where .= " AND (c.plate_number LIKE ? OR c.vin LIKE ? OR c.series LIKE ?)";
            $keyword = '%' . $params['keyword'] . '%';
            $bindParams[] = $keyword;
            $bindParams[] = $keyword;
            $bindParams[] = $keyword;
        }
        
        // 授权车源（他店）
        if (isset($params['authorized_store_id']) && $params['authorized_store_id'] > 0) {
            $where .= " AND EXISTS (SELECT 1 FROM uc_car_authorizations ca WHERE ca.car_id = c.id AND ca.authorized_store_id = ? AND ca.is_revoked = 0)";
            $bindParams[] = $params['authorized_store_id'];
        }
        
        // 全部（本店+授权）
        if (isset($params['store_id_or_authorized']) && $params['store_id_or_authorized'] > 0) {
            $storeId = $params['store_id_or_authorized'];
            $where .= " AND (c.store_id = ? OR EXISTS (SELECT 1 FROM uc_car_authorizations ca WHERE ca.car_id = c.id AND ca.authorized_store_id = ? AND ca.is_revoked = 0))";
            $bindParams[] = $storeId;
            $bindParams[] = $storeId;
        }
        
        $sql = "SELECT c.*, s.store_name, s.store_phone, u.real_name as input_user_name 
                FROM uc_cars c 
                LEFT JOIN uc_stores s ON c.store_id = s.id 
                LEFT JOIN uc_users u ON c.input_user_id = u.id 
                {$where} 
                ORDER BY c.create_time DESC 
                LIMIT {$limit} OFFSET {$offset}";
        
        $list = $this->db->query($sql, $bindParams);
        
        // 获取总数
        $countSql = "SELECT COUNT(*) as total FROM uc_cars c {$where}";
        $total = $this->db->queryOne($countSql, $bindParams)['total'] ?? 0;
        
        return ['list' => $list, 'total' => $total];
    }
    
    /**
     * 获取车源详情
     */
    public function getById($id)
    {
        $sql = "SELECT c.*, s.store_name, s.store_phone, u.real_name as input_user_name 
                FROM uc_cars c 
                LEFT JOIN uc_stores s ON c.store_id = s.id 
                LEFT JOIN uc_users u ON c.input_user_id = u.id 
                WHERE c.id = ?";
        return $this->db->queryOne($sql, [$id]);
    }
    
    /**
     * 根据VIN获取
     */
    public function getByVin($vin)
    {
        if (empty($vin)) {
            return null;
        }
        $sql = "SELECT * FROM uc_cars WHERE vin = ? LIMIT 1";
        return $this->db->queryOne($sql, [$vin]);
    }
    
    /**
     * 创建车源
     */
    public function create($data)
    {
        $years = $this->calculateYears($data['first_register_time']);
        
        $sql = "INSERT INTO uc_cars (
            store_id, input_user_id, brand, series, model, color, first_register_time, years,
            vin, plate_number, mileage, condition_description, purchase_price, purchase_time,
            car_status, audit_status, displacement, transmission, fuel_type, emission_standard,
            transfer_count, insurance_status, inspection_status, car_config,
            accident_record, maintenance_record, remark, create_time, update_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        return $this->db->insert($sql, [
            $data['store_id'],
            $data['input_user_id'],
            $data['brand'],
            $data['series'],
            $data['model'] ?? '',
            $data['color'],
            $data['first_register_time'],
            $years,
            $data['vin'],
            $data['plate_number'],
            $data['mileage'],
            $data['condition_description'],
            $data['purchase_price'],
            time(),
            $data['car_status'] ?? '收钥匙',
            '待审核',
            $data['displacement'] ?? '',
            $data['transmission'] ?? '',
            $data['fuel_type'] ?? '',
            $data['emission_standard'] ?? '',
            $data['transfer_count'] ?? 0,
            $data['insurance_expire_time'] ?? null,
            $data['inspection_expire_time'] ?? null,
            $data['car_config'] ?? '',
            $data['accident_record'] ?? '',
            $data['maintenance_record'] ?? '',
            $data['remark'] ?? '',
            time(),
            time()
        ]);
    }
    
    /**
     * 更新车源
     */
    public function update($id, $data)
    {
        $years = isset($data['first_register_time']) ? $this->calculateYears($data['first_register_time']) : null;
        
        $fields = [];
        $values = [];
        
        $allowedFields = ['brand', 'series', 'model', 'color', 'first_register_time', 'vin', 'plate_number',
            'mileage', 'condition_description', 'purchase_price', 'car_status', 'displacement', 'transmission',
            'fuel_type', 'emission_standard', 'transfer_count', 'insurance_expire_time', 'inspection_expire_time',
            'car_config', 'accident_record', 'maintenance_record', 'remark'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = ?";
                $values[] = $data[$field];
            }
        }
        
        if ($years !== null) {
            $fields[] = "years = ?";
            $values[] = $years;
        }
        
        $fields[] = "update_time = ?";
        $values[] = time();
        $values[] = $id;
        
        $sql = "UPDATE uc_cars SET " . implode(', ', $fields) . " WHERE id = ?";
        return $this->db->execute($sql, $values);
    }
    
    /**
     * 审核车源
     */
    public function audit($id, $auditStatus, $auditUserId, $auditRemark = '')
    {
        $updateData = [
            'audit_status' => $auditStatus,
            'audit_user_id' => $auditUserId,
            'audit_time' => time(),
            'audit_remark' => $auditRemark
        ];
        
        if ($auditStatus == '审核通过') {
            $updateData['submit_headquarters_time'] = time();
        }
        
        $sql = "UPDATE uc_cars SET audit_status = ?, audit_user_id = ?, audit_time = ?, audit_remark = ?, submit_headquarters_time = ?, update_time = ? WHERE id = ?";
        return $this->db->execute($sql, [
            $updateData['audit_status'],
            $updateData['audit_user_id'],
            $updateData['audit_time'],
            $updateData['audit_remark'],
            $updateData['submit_headquarters_time'] ?? 0,
            time(),
            $id
        ]);
    }
    
    /**
     * 标记车辆为已售出
     */
    public function sell($id, $soldStoreId)
    {
        $now = time();
        $sql = "UPDATE uc_cars SET car_status = '已售出', sold_store_id = ?, sold_time = ?, update_time = ? WHERE id = ?";
        return $this->db->execute($sql, [$soldStoreId, $now, $id]);
    }
    
    /**
     * 计算年限
     */
    private function calculateYears($firstRegisterTime)
    {
        $registerDate = new \DateTime($firstRegisterTime);
        $now = new \DateTime();
        $diff = $now->diff($registerDate);
        return $diff->y;
    }
}

