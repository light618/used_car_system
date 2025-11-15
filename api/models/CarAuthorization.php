<?php
/**
 * 车源授权模型
 */

namespace App\Models;

use App\Models\Database;

class CarAuthorization
{
    private $db;
    
    public function __construct()
    {
        $this->db = Database::getInstance();
    }
    
    /**
     * 授权车源给门店
     */
    public function authorize($carId, $storeIds, $authorizeUserId)
    {
        $this->db->beginTransaction();
        try {
            foreach ($storeIds as $storeId) {
                // 检查是否已授权
                $sql = "SELECT id FROM uc_car_authorizations WHERE car_id = ? AND authorized_store_id = ? AND is_revoked = 0";
                $exists = $this->db->queryOne($sql, [$carId, $storeId]);
                
                if (!$exists) {
                    // 如果是收回后重新授权，更新记录
                    $sql = "SELECT id FROM uc_car_authorizations WHERE car_id = ? AND authorized_store_id = ? AND is_revoked = 1";
                    $revoked = $this->db->queryOne($sql, [$carId, $storeId]);
                    
                    if ($revoked) {
                        $sql = "UPDATE uc_car_authorizations SET is_revoked = 0, authorize_user_id = ?, authorize_time = ?, revoke_time = 0 WHERE id = ?";
                        $this->db->execute($sql, [$authorizeUserId, time(), $revoked['id']]);
                    } else {
                        $sql = "INSERT INTO uc_car_authorizations (car_id, authorized_store_id, authorize_user_id, authorize_time) VALUES (?, ?, ?, ?)";
                        $this->db->insert($sql, [$carId, $storeId, $authorizeUserId, time()]);
                    }
                }
            }
            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
    
    /**
     * 收回授权
     */
    public function revoke($carId, $storeIds)
    {
        $sql = "UPDATE uc_car_authorizations SET is_revoked = 1, revoke_time = ? WHERE car_id = ? AND authorized_store_id IN (" . implode(',', array_fill(0, count($storeIds), '?')) . ")";
        $params = [time(), $carId];
        $params = array_merge($params, $storeIds);
        return $this->db->execute($sql, $params);
    }
    
    /**
     * 获取车源的授权门店列表
     */
    public function getAuthorizedStores($carId)
    {
        $sql = "SELECT ca.*, s.store_name, s.store_code, s.store_phone 
                FROM uc_car_authorizations ca 
                LEFT JOIN uc_stores s ON ca.authorized_store_id = s.id 
                WHERE ca.car_id = ? AND ca.is_revoked = 0 
                ORDER BY ca.authorize_time DESC";
        return $this->db->query($sql, [$carId]);
    }
    
    /**
     * 检查门店是否有权限查看车源
     */
    public function hasPermission($carId, $storeId)
    {
        $sql = "SELECT COUNT(*) as count FROM uc_car_authorizations WHERE car_id = ? AND authorized_store_id = ? AND is_revoked = 0";
        $result = $this->db->queryOne($sql, [$carId, $storeId]);
        return $result['count'] > 0;
    }
}

