<?php
/**
 * 响应工具类
 * 主公，这是统一响应格式的工具类
 */

namespace App\Utils;

class Response
{
    /**
     * 成功响应
     */
    public static function success($data = [], $msg = '操作成功', $code = 200)
    {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'code' => $code,
            'msg' => $msg,
            'data' => $data,
            'timestamp' => time()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * 错误响应
     */
    public static function error($msg = '操作失败', $code = 400, $data = [])
    {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'code' => $code,
            'msg' => $msg,
            'data' => $data,
            'timestamp' => time()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * 分页响应
     */
    public static function paginate($list = [], $total = 0, $page = 1, $limit = 10, $msg = '获取成功')
    {
        return self::success([
            'list' => $list,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit)
            ]
        ], $msg);
    }
}

