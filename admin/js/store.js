/**
 * 门店管理
 */
const Store = {
    /**
     * 获取门店列表
     */
    async getList(page = 1, limit = 20, keyword = '') {
        return API.post('/store/list', { page, limit, keyword });
    },
    
    /**
     * 获取门店详情
     */
    async getDetail(id) {
        return API.post('/store/detail', { id });
    },
    
    /**
     * 创建门店
     */
    async create(data) {
        return API.post('/store/create', data);
    },
    
    /**
     * 更新门店
     */
    async update(data) {
        return API.post('/store/update', data);
    },
    
    /**
     * 删除门店
     */
    async delete(id) {
        return API.post('/store/delete', { id });
    },
    
    /**
     * 获取所有门店
     */
    async getAll() {
        return API.post('/store/all', {});
    }
};

