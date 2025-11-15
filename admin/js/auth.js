/**
 * 认证相关
 */
const Auth = {
    /**
     * 登录
     */
    async login(username, password, captcha) {
        console.log('Auth.login 调用，参数:', { username, password: '***', captcha });
        try {
            const result = await API.post('/auth/login', { username, password, captcha });
            console.log('API.post 返回结果:', result);
            
            if (!result || !result.data) {
                throw new Error('登录响应数据格式错误');
            }
            
            if (!result.data.token) {
                throw new Error('登录响应缺少token');
            }
            
            if (!result.data.user) {
                throw new Error('登录响应缺少user信息');
            }
            
            API.setToken(result.data.token);
            console.log('Token已设置');
            return result.data.user;
        } catch (error) {
            console.error('Auth.login 错误:', error);
            throw error;
        }
    },
    
    /**
     * 获取当前用户信息
     */
    async getCurrentUser() {
        const result = await API.post('/auth/me', {});
        return result.data;
    },
    
    /**
     * 退出登录
     */
    logout() {
        API.clearToken();
        window.location.reload();
    }
};

