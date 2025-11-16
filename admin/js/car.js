/**
 * 车源管理
 */
const Car = {
    /**
     * 获取车源列表
     */
    async getList(params = {}) {
        return API.post('/car/list', params);
    },
    
    /**
     * 获取车源详情
     */
    async getDetail(id) {
        return API.post('/car/detail', { id });
    },
    
    /**
     * 创建车源
     */
    async create(data) {
        return API.post('/car/create', data);
    },
    
    /**
     * 更新车源
     */
    async update(data) {
        return API.post('/car/update', data);
    },
    
    /**
     * 审核车源
     */
    async audit(id, auditStatus, auditRemark = '') {
        return API.post('/car/audit', { id, audit_status: auditStatus, audit_remark: auditRemark });
    },
    
    /**
     * 授权车源
     */
    async authorize(carId, storeIds) {
        return API.post('/car/authorize', { car_id: carId, store_ids: JSON.stringify(storeIds) });
    },
    
    /**
     * 收回授权
     */
    async revoke(carId, storeIds) {
        return API.post('/car/revoke', { car_id: carId, store_ids: JSON.stringify(storeIds) });
    },
    
    /**
     * 出售车源
     */
    async sell(carId, storeId) {
        return API.post('/car/sell', { car_id: carId, store_id: storeId });
    }
};

