<?php
/**
 * 验证码控制器
 */

namespace App\Controllers;

use App\Utils\Response;

class CaptchaController
{
    /**
     * 生成验证码图片
     */
    public function generate()
    {
        // 创建验证码图片
        $width = 100;
        $height = 40;
        $image = imagecreatetruecolor($width, $height);
        
        // 设置颜色
        $bgColor = imagecolorallocate($image, 255, 255, 255);
        $textColor = imagecolorallocate($image, 0, 0, 0);
        $lineColor = imagecolorallocate($image, 200, 200, 200);
        
        // 填充背景
        imagefill($image, 0, 0, $bgColor);
        
        // 生成4位随机验证码
        $code = '';
        $chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        for ($i = 0; $i < 4; $i++) {
            $code .= $chars[rand(0, strlen($chars) - 1)];
        }
        
        // 保存验证码到session
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION['captcha_code'] = strtolower($code);
        
        // 绘制干扰线
        for ($i = 0; $i < 5; $i++) {
            imageline($image, rand(0, $width), rand(0, $height), rand(0, $width), rand(0, $height), $lineColor);
        }
        
        // 绘制验证码文字
        $fontSize = 5;
        $x = 15;
        $y = 25;
        for ($i = 0; $i < 4; $i++) {
            $char = $code[$i];
            imagestring($image, $fontSize, $x + $i * 20, $y, $char, $textColor);
        }
        
        // 输出图片
        header('Content-Type: image/png');
        header('Cache-Control: no-cache, must-revalidate');
        imagepng($image);
        imagedestroy($image);
        exit;
    }
    
    /**
     * 验证验证码
     */
    public static function verify($inputCode)
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $storedCode = $_SESSION['captcha_code'] ?? '';
        $inputCode = strtolower(trim($inputCode));
        
        // 验证后清除验证码（一次性使用）
        unset($_SESSION['captcha_code']);
        
        return !empty($storedCode) && $storedCode === $inputCode;
    }
}


