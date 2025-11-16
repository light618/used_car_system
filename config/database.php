<?php
/**
 * 数据库配置文件
 * 主公，请根据实际环境修改配置
 */

// 兼容 Railway 的 MYSQL_URL（形如：mysql://user:pass@host:port/database）
$mysqlUrl = getenv('MYSQL_URL') ?: getenv('JAWSDB_URL');
if ($mysqlUrl) {
    $parts = parse_url($mysqlUrl);
    // 允许 mysql:// 和 mysql2:// 等前缀
    $database = isset($parts['path']) ? ltrim($parts['path'], '/') : '';
    $hostname = $parts['host'] ?? '127.0.0.1';
    $username = $parts['user'] ?? 'root';
    $password = $parts['pass'] ?? '';
    $hostport = $parts['port'] ?? '3306';
} else {
    $hostname = getenv('MYSQL_HOST') ?: getenv('DB_HOST') ?: '127.0.0.1';
    $database = getenv('MYSQL_DATABASE') ?: getenv('DB_NAME') ?: 'used_car_system';
    $username = getenv('MYSQL_USER') ?: getenv('DB_USER') ?: 'root';
    $password = getenv('MYSQL_PASSWORD') ?: getenv('DB_PASSWORD') ?: '';
    $hostport = getenv('MYSQL_PORT') ?: getenv('DB_PORT') ?: '3306';
}

return [
    // 数据库类型
    'type'            => 'mysql',
    // 服务器地址
    'hostname'        => $hostname,
    // 数据库名
    'database'        => $database,
    // 用户名
    'username'        => $username,
    // 密码
    'password'        => $password,
    // 端口
    'hostport'        => $hostport,
    // 连接dsn
    'dsn'             => '',
    // 数据库连接参数
    'params'          => [],
    // 数据库编码默认采用utf8mb4
    'charset'         => 'utf8mb4',
    // 数据库表前缀
    'prefix'          => 'uc_',
    // 数据库调试模式
    'debug'           => true,
    // 数据库部署方式:0 集中式(单一服务器),1 分布式(主从服务器)
    'deploy'          => 0,
    // 数据库读写是否分离 主从式有效
    'rw_separate'     => false,
    // 读写分离后 主服务器数量
    'master_num'      => 1,
    // 指定从服务器序号
    'slave_no'        => '',
    // 是否严格检查字段是否存在
    'fields_strict'   => true,
    // 是否需要断线重连
    'break_reconnect' => false,
    // 监听SQL
    'trigger_sql'     => true,
    // 开启字段缓存
    'fields_cache'    => false,
];

