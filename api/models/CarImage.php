<?php
/**
 * 车源图片模型
 */

namespace App\Models;

use App\Models\Database;

class CarImage
{
    private $db;
    
    public function __construct()
    {
        $this->db = Database::getInstance();
    }
    
    /**
     * 获取车源图片
     */
    public function getByCarId($carId, $imageType = '')
    {
        $sql = "SELECT * FROM uc_car_images WHERE car_id = ?";
        $params = [$carId];
        
        if ($imageType) {
            $sql .= " AND image_type = ?";
            $params[] = $imageType;
        }
        
        $sql .= " ORDER BY image_type, sort_order, id";
        return $this->db->query($sql, $params);
    }
    
    /**
     * 添加图片
     */
    public function add($carId, $imageType, $imageUrl, $sortOrder = 0)
    {
        $sql = "INSERT INTO uc_car_images (car_id, image_type, image_url, sort_order, create_time) VALUES (?, ?, ?, ?, ?)";
        return $this->db->insert($sql, [$carId, $imageType, $imageUrl, $sortOrder, time()]);
    }
    
    /**
     * 删除图片
     */
    public function delete($id)
    {
        $sql = "DELETE FROM uc_car_images WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }
    
    /**
     * 删除车源所有图片
     */
    public function deleteByCarId($carId)
    {
        $sql = "DELETE FROM uc_car_images WHERE car_id = ?";
        return $this->db->execute($sql, [$carId]);
    }
}

