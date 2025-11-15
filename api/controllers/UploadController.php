<?php
/**
 * 文件上传控制器
 */

namespace App\Controllers;

use App\Middleware\Auth;
use App\Utils\Response;

class UploadController
{
    /**
     * 上传图片
     */
    public function image()
    {
        Auth::verifyToken();
        
        if (!isset($_FILES['file'])) {
            Response::error('请选择文件');
        }
        
        $file = $_FILES['file'];
        $type = $_POST['type'] ?? 'car'; // car车辆照片 / green_book绿本照片
        
        // 验证文件类型
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!in_array($file['type'], $allowedTypes)) {
            Response::error('只支持jpg、png、gif格式的图片');
        }
        
        // 验证文件大小（最大5MB）
        if ($file['size'] > 5 * 1024 * 1024) {
            Response::error('图片大小不能超过5MB');
        }
        
        // 生成文件名
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = date('YmdHis') . '_' . uniqid() . '.' . $ext;
        
        // 保存路径
        $uploadDir = $type == 'green_book' ? 'greenbook' : 'cars';
        $savePath = __DIR__ . '/../../public/uploads/' . $uploadDir . '/' . $filename;
        
        // 确保目录存在
        $dir = dirname($savePath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        // 移动文件
        if (move_uploaded_file($file['tmp_name'], $savePath)) {
            $url = '/uploads/' . $uploadDir . '/' . $filename;
            Response::success(['url' => $url], '上传成功');
        } else {
            Response::error('上传失败');
        }
    }
}

