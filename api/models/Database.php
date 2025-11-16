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
     * 确保数据库已初始化并执行必要的迁移
     */
    private function ensureInitialized()
    {
        // 如果系统尚未创建核心表，则先执行基础 schema.sql
        try {
            $stmt = $this->connection->query("SHOW TABLES LIKE 'uc_users'");
            $exists = $stmt ? $stmt->fetch() : false;
            if (!$exists) {
                $schemaFile = __DIR__ . '/../../database/schema.sql';
                if (file_exists($schemaFile)) {
                    $sql = file_get_contents($schemaFile);
                    if ($sql !== false && trim($sql) !== '') {
                        $lines = preg_split('/\r?\n/', $sql);
                        $clean = [];
                        foreach ($lines as $line) {
                            $line = trim($line);
                            if ($line === '' || strpos($line, '--') === 0 || strpos($line, '#') === 0) {
                                continue;
                            }
                            $line = rtrim($line);
                            $clean[] = $line;
                        }
                        $batch = implode("\n", $clean);
                        $stmts = preg_split('/;\s*\n|;\s*$/m', $batch);
                        $this->connection->beginTransaction();
                        try {
                            foreach ($stmts as $st) {
                                $st = trim($st);
                                if ($st !== '') {
                                    $this->connection->exec($st);
                                }
                            }
                            $this->connection->commit();
                        } catch (\Throwable $ie) {
                            $this->connection->rollBack();
                            error_log('[DB Init] 执行基础 schema 失败: ' . $ie->getMessage());
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            // 忽略检查失败但记录
            error_log('[DB Init] 检查核心表失败: ' . $e->getMessage());
        }

        // 运行幾何迁移脚本（database/migrations/*.sql），按文件名顺序一次性执行
        try {
            $this->connection->exec("CREATE TABLE IF NOT EXISTS `uc_migrations` (\n  `id` INT AUTO_INCREMENT PRIMARY KEY,\n  `name` VARCHAR(255) UNIQUE,\n  `applied_at` INT NOT NULL\n)");
            $applied = [];
            $res = $this->connection->query("SELECT `name` FROM `uc_migrations`");
            if ($res) {
                foreach ($res as $row) {
                    $applied[$row['name']] = true;
                }
            }
            $dir = __DIR__ . '/../../database/migrations';
            if (is_dir($dir)) {
                $files = glob($dir . '/*.sql');
                sort($files, SORT_STRING);
                foreach ($files as $file) {
                    $name = basename($file);
                    if (isset($applied[$name])) {
                        continue; // 已应用
                    }
                    $sql = file_get_contents($file);
                    if ($sql === false || trim($sql) === '') {
                        continue;
                    }
                    $parts = preg_split('/;\s*\n|;\s*$/m', $sql);
                    $this->connection->beginTransaction();
                    try {
                        foreach ($parts as $p) {
                            $p = trim($p);
                            if ($p !== '') {
                                $this->connection->exec($p);
                            }
                        }
                        $ins = $this->connection->prepare("INSERT INTO `uc_migrations` (`name`, `applied_at`) VALUES (?, ?)");
                        $ins->execute([$name, time()]);
                        $this->connection->commit();
                    } catch (\Throwable $ie) {
                        $this->connection->rollBack();
                        error_log('[DB Migration] 执行失败 ' . $name . ': ' . $ie->getMessage());
                    }
                }
            }
        } catch (\Throwable $e) {
            // 记录但不阻塞启动
            error_log('[DB Migration] 初始化失败: ' . $e->getMessage());
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

