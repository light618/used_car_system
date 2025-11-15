<?php
/**
 * 数据库配置文件
 * 主公，请根据实际环境修改配置
 */

return [
    // 数据库类型
    'type'            => 'mysql',
    // 服务器地址（支持Railway环境变量）
    'hostname'        => getenv('MYSQL_HOST') ?: getenv('DB_HOST') ?: '127.0.0.1',
    // 数据库名（支持Railway环境变量）
    'database'        => getenv('MYSQL_DATABASE') ?: getenv('DB_NAME') ?: 'used_car_system',
    // 用户名（支持Railway环境变量）
    'username'        => getenv('MYSQL_USER') ?: getenv('DB_USER') ?: 'root',
    // 密码（支持Railway环境变量）
    'password'        => getenv('MYSQL_PASSWORD') ?: getenv('DB_PASSWORD') ?: '',
    // 端口（支持Railway环境变量）
    'hostport'        => getenv('MYSQL_PORT') ?: getenv('DB_PORT') ?: '3306',
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

