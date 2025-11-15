<?php
/**
 * JWT工具类
 * 主公，这是JWT token生成和验证的工具类
 */

namespace App\Utils;

class Jwt
{
    private static $secret = 'your-secret-key-change-it';
    
    /**
     * 生成token
     */
    public static function encode($payload)
    {
        $config = require __DIR__ . '/../../config/app.php';
        self::$secret = $config['app_key'] ?? self::$secret;
        
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];
        
        $base64Header = self::base64UrlEncode(json_encode($header));
        $base64Payload = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, self::$secret, true);
        $base64Signature = self::base64UrlEncode($signature);
        
        return $base64Header . '.' . $base64Payload . '.' . $base64Signature;
    }
    
    /**
     * 验证token
     */
    public static function decode($token)
    {
        $config = require __DIR__ . '/../../config/app.php';
        self::$secret = $config['app_key'] ?? self::$secret;
        
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        list($base64Header, $base64Payload, $base64Signature) = $parts;
        
        $signature = self::base64UrlDecode($base64Signature);
        $expectedSignature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, self::$secret, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            return false;
        }
        
        $payload = json_decode(self::base64UrlDecode($base64Payload), true);
        
        // 检查过期时间
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    }
    
    /**
     * Base64 URL编码
     */
    private static function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Base64 URL解码
     */
    private static function base64UrlDecode($data)
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

