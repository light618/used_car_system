<?php
/**
 * 数据库连接类
 * 主公，这是数据库操作的核心类
 */

namespace App\Models;

class Database
{
    private static $instance = null;
    private $connection = null;
    
    private function __construct()
    {
        $config = require __DIR__ . '/../../config/database.php';
        
        try {
            $dsn = sprintf(
                "mysql:host=%s;port=%s;dbname=%s;charset=%s",
                $config['hostname'],
                $config['hostport'],
                $config['database'],
                $config['charset']
            );
            
            $this->connection = new \PDO(
                $dsn,
                $config['username'],
                $config['password'],
                [
                    \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                    \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                    \PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );

            // 首次运行自动初始化数据库表结构
            $this->ensureInitialized();
        } catch (\PDOException $e) {
            die('数据库连接失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 确保数据库已初始化（若缺少核心表则执行 schema.sql）
     */
    private function ensureInitialized()
    {
        try {
            $stmt = $this->connection->query("SHOW TABLES LIKE 'uc_users'");
            $exists = $stmt->fetch();
            if ($exists) {
                return; // 已初始化
            }
        } catch (\Throwable $e) {
            // 忽略检测错误，尝试初始化
        }
        
        $schemaFile = __DIR__ . '/../../database/schema.sql';
        if (!file_exists($schemaFile)) {
            return; // 无法初始化（缺少文件），静默跳过
        }
        
        $sql = file_get_contents($schemaFile);
        if ($sql === false || trim($sql) === '') {
            return;
        }
        
        // 去除注释并按分号拆分执行
        $lines = preg_split('/\r?\n/', $sql);
        $clean = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '--') === 0 || strpos($line, '#') === 0) {
                continue;
            }
            $clean[] = $line;
        }
        $sqlClean = implode("\n", $clean);
        $statements = array_filter(array_map('trim', preg_split('/;\s*\n|;\s*$/m', $sqlClean)));
        
        $this->connection->beginTransaction();
        try {
            foreach ($statements as $statement) {
                if ($statement !== '') {
                    $this->connection->exec($statement);
                }
            }
            $this->connection->commit();
        } catch (\Throwable $e) {
            $this->connection->rollBack();
            // 初始化失败不应让服务崩溃，记录到错误日志
            error_log('[DB Init] 初始化失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 获取单例
     */
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * 获取连接
     */
    public function getConnection()
    {
        return $this->connection;
    }
    
    /**
     * 查询
     */
    public function query($sql, $params = [])
    {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    /**
     * 查询单条
     */
    public function queryOne($sql, $params = [])
    {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch();
    }
    
    /**
     * 执行
     */
    public function execute($sql, $params = [])
    {
        $stmt = $this->connection->prepare($sql);
        return $stmt->execute($params);
    }
    
    /**
     * 插入并返回ID
     */
    public function insert($sql, $params = [])
    {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $this->connection->lastInsertId();
    }
    
    /**
     * 开始事务
     */
    public function beginTransaction()
    {
        return $this->connection->beginTransaction();
    }
    
    /**
     * 提交事务
     */
    public function commit()
    {
        return $this->connection->commit();
    }
    
    /**
     * 回滚事务
     */
    public function rollBack()
    {
        return $this->connection->rollBack();
    }
}

