<?php
/**
 * 请求工具类
 */

namespace App\Utils;

class Request
{
    /**
     * 获取请求数据（支持JSON和POST）
     */
    public static function getData()
    {
        $input = file_get_contents('php://input');
        $jsonData = json_decode($input, true);
        
        if ($jsonData && is_array($jsonData)) {
            return array_merge($_POST, $jsonData);
        }
        
        return $_POST;
    }
    
    /**
     * 获取GET参数
     */
    public static function get($key = null, $default = null)
    {
        if ($key === null) {
            return $_GET;
        }
        return $_GET[$key] ?? $default;
    }
}

