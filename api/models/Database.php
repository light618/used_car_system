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
        } catch (\PDOException $e) {
            die('数据库连接失败: ' . $e->getMessage());
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

