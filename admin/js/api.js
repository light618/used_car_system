/**
 * API请求封装
 */
const API = {
    baseURL: '/api',
    token: localStorage.getItem('token') || '',
    
    /**
     * 设置token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    },
    
    /**
     * 清除token
     */
    clearToken() {
        this.token = '';
        localStorage.removeItem('token');
    },
    
    /**
     * 请求方法
     */
    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        const config = {
            ...options,
            headers
        };
        
        try {
            const response = await fetch(this.baseURL + url, config);
            
            // 检查响应状态
            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP错误响应:', response.status, response.statusText);
                console.error('错误内容:', errorText);
                throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
            }
            
            // 解析JSON响应
            let data;
            try {
                const text = await response.text();
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('JSON解析失败:', parseError);
                throw new Error('服务器响应格式错误');
            }
            
            if (data.code === 401) {
                // token过期，跳转登录
                this.clearToken();
                window.location.reload();
                return;
            }
            
            if (data.code !== 200) {
                throw new Error(data.msg || '请求失败');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            console.error('请求URL:', this.baseURL + url);
            console.error('请求方法:', config.method);
            console.error('请求体:', config.body);
            throw error;
        }
    },
    
    /**
     * GET请求（已改为POST）
     */
    async get(url, params = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(params)
        });
    },
    
    /**
     * POST请求
     */
    async post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * 文件上传
     */
    async upload(url, file, type = 'car') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        const response = await fetch(this.baseURL + url, {
            method: 'POST',
            headers,
            body: formData
        });
        
        const data = await response.json();
        
        if (data.code !== 200) {
            throw new Error(data.msg || '上传失败');
        }
        
        return data;
    }
};

