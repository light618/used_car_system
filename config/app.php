<?php
/**
 * 应用配置文件
 */

return [
    // 应用名称
    'app_name' => '二手车管理系统',
    
    // 应用版本
    'app_version' => '1.0.0',
    
    // 应用调试模式
    'app_debug' => true,
    
    // 应用Trace
    'app_trace' => false,
    
    // 应用模式状态
    'app_status' => '',
    
    // 是否支持多模块
    'app_multi_module' => true,
    
    // 入口自动绑定模块
    'auto_bind_module' => false,
    
    // 注册的根命名空间
    'root_namespace' => [],
    
    // 扩展函数文件
    'extra_file_list' => [],
    
    // 默认输出类型
    'default_return_type' => 'json',
    
    // 默认AJAX 数据返回格式,可选json xml ...
    'default_ajax_return' => 'json',
    
    // 默认JSONP格式返回的处理方法
    'default_jsonp_handler' => 'jsonpReturn',
    
    // 默认时区
    'default_timezone' => 'Asia/Shanghai',
    
    // 是否开启路由
    'url_route_on' => true,
    
    // 路由使用完整匹配
    'route_complete_match' => false,
    
    // 是否强制使用路由
    'url_route_must' => false,
    
    // 域名部署
    'app_sub_domain_deploy' => false,
    
    // 域名根，如.thinkphp.cn
    'app_domain_root' => '',
    
    // 是否去除URL中的.html后缀
    'url_html_suffix' => 'html',
    
    // 加密密钥
    'app_key' => 'your-secret-key-here-change-it',
    
    // Session设置
    'session' => [
        'id'             => '',
        'var_session_id' => '',
        'prefix'         => 'uc_',
        'type'           => '',
        'auto_start'     => true,
    ],
    
    // Cookie设置
    'cookie' => [
        'prefix'    => 'uc_',
        'expire'    => 0,
        'path'      => '/',
        'domain'    => '',
        'secure'    => false,
        'httponly'  => '',
        'setcookie' => true,
    ],
    
    // 微信小程序配置
    'wechat' => [
        'appid' => 'your-miniprogram-appid',
        'secret' => 'your-miniprogram-secret',
    ],
];

