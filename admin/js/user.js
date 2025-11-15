/**
 * 用户管理
 */
const User = {
    /**
     * 修改密码
     */
    async changePassword(oldPassword, newPassword) {
        return API.post('/user/change-password', { old_password: oldPassword, new_password: newPassword });
    },
    
    /**
     * 重置密码（总部）
     */
    async resetPassword(userId, newPassword) {
        return API.post('/user/reset-password', { user_id: userId, new_password: newPassword });
    }
};

