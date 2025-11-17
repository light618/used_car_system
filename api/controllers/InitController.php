<?php
/**
 * 初始化控制器
 * 用于初始化测试数据
 */

namespace App\Controllers;

use App\Utils\Response;
use App\Models\Database;

class InitController
{
    /**
     * 初始化测试数据
     * 访问：GET /init/seed-data?key=YOUR_SECRET_KEY
     */
    public function seedData()
    {
        // 安全检查：检查密钥（可以通过环境变量设置）
        $secretKey = getenv('INIT_SECRET_KEY') ?: 'init_2024';
        $requestKey = $_GET['key'] ?? '';
        
        if ($requestKey !== $secretKey) {
            Response::error('未授权访问', 403);
        }
        
        // 执行初始化脚本
        $scriptPath = __DIR__ . '/../../scripts/seed_test_data.php';
        
        if (!file_exists($scriptPath)) {
            Response::error('初始化脚本不存在', 404);
        }
        
        // 使用 exec 执行脚本并捕获输出
        $output = [];
        $returnVar = 0;
        
        // 切换到脚本目录执行
        $scriptDir = dirname($scriptPath);
        $scriptFile = basename($scriptPath);
        
        // 执行脚本
        exec("cd {$scriptDir} && php {$scriptFile} 2>&1", $output, $returnVar);
        
        $outputText = implode("\n", $output);
        
        if ($returnVar !== 0) {
            Response::error('初始化失败: ' . $outputText, 500);
        }
        
        Response::success([
            'message' => '测试数据初始化成功',
            'output' => $outputText
        ]);
    }
    
    /**
     * 检查数据库连接信息（用于调试）
     */
    public function checkDb()
    {
        $secretKey = getenv('INIT_SECRET_KEY') ?: 'init_2024';
        $requestKey = $_GET['key'] ?? '';
        
        if ($requestKey !== $secretKey) {
            Response::error('未授权访问', 403);
        }
        
        $dbConfig = require __DIR__ . '/../../config/database.php';
        
        // 测试连接
        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->query("SELECT DATABASE() as db, COUNT(*) as car_count FROM uc_cars");
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            Response::success([
                'config' => [
                    'hostname' => $dbConfig['hostname'],
                    'database' => $dbConfig['database'],
                    'username' => $dbConfig['username'],
                    'port' => $dbConfig['hostport'],
                    'has_mysql_url' => !empty(getenv('MYSQL_URL'))
                ],
                'connection' => [
                    'current_database' => $result['db'] ?? '未知',
                    'car_count' => $result['car_count'] ?? 0
                ]
            ]);
        } catch (\Exception $e) {
            Response::error('数据库连接失败: ' . $e->getMessage(), 500);
        }
    }
}

