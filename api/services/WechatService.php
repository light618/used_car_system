<?php
/**
 * 微信服务类
 * 主公，这是微信小程序API调用的服务类
 */

namespace App\Services;

class WechatService
{
    private $appid;
    private $secret;
    
    public function __construct()
    {
        $config = require __DIR__ . '/../../config/app.php';
        $this->appid = $config['wechat']['appid'] ?? '';
        $this->secret = $config['wechat']['secret'] ?? '';
    }
    
    /**
     * 通过code获取openid
     */
    public function getOpenidByCode($code)
    {
        $url = "https://api.weixin.qq.com/sns/jscode2session";
        $params = [
            'appid' => $this->appid,
            'secret' => $this->secret,
            'js_code' => $code,
            'grant_type' => 'authorization_code'
        ];
        
        $url .= '?' . http_build_query($params);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($ch);
        curl_close($ch);
        
        $result = json_decode($response, true);
        
        if (isset($result['openid'])) {
            return [
                'openid' => $result['openid'],
                'unionid' => $result['unionid'] ?? '',
                'session_key' => $result['session_key'] ?? ''
            ];
        }
        
        return false;
    }
    
    /**
     * 获取access_token
     */
    public function getAccessToken()
    {
        $url = "https://api.weixin.qq.com/cgi-bin/token";
        $params = [
            'grant_type' => 'client_credential',
            'appid' => $this->appid,
            'secret' => $this->secret
        ];
        
        $url .= '?' . http_build_query($params);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($ch);
        curl_close($ch);
        
        $result = json_decode($response, true);
        
        if (isset($result['access_token'])) {
            return $result['access_token'];
        }
        
        return false;
    }
}

