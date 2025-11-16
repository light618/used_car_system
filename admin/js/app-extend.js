/**
 * 应用扩展功能
 */

// 渲染车源审核页面
App.renderCarAudit = async function() {
    document.getElementById('page-title').textContent = '待审核车源';
    
    const result = await Car.getList({ page: 1, limit: 20, audit_status: '待审核' });
    const cars = result.data.list;
    
    const html = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">待审核车源</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>车牌号</th>
                            <th>品牌/车型</th>
                            <th>收车价</th>
                            <th>录入时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cars.length === 0 ? `
                            <tr>
                                <td colspan="5" style="text-align: center; padding: 40px;">
                                    <div class="empty-state">
                                        <i class="fas fa-clipboard-check"></i>
                                        <p>暂无待审核车源</p>
                                    </div>
                                </td>
                            </tr>
                        ` : cars.map(car => `
                            <tr>
                                <td>${car.plate_number}</td>
                                <td>${car.brand} ${car.series}</td>
                                <td>¥${car.purchase_price}</td>
                                <td>${new Date(car.create_time * 1000).toLocaleString()}</td>
                                <td>
                                    <button class="btn btn-secondary" onclick="App.showCarDetail(${car.id})">查看详情</button>
                                    <button class="btn btn-success" onclick="App.auditCar(${car.id}, '审核通过')">通过</button>
                                    <button class="btn btn-danger" onclick="App.showRejectModal(${car.id})">驳回</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    document.getElementById('content-area').innerHTML = html;
};

// 审核车源
App.auditCar = async function(carId, auditStatus, auditRemark = '') {
    try {
        await Car.audit(carId, auditStatus, auditRemark);
        Toast.success(auditStatus === '审核通过' ? '审核通过' : '已驳回');
        await this.renderCarAudit();
    } catch (error) {
        Toast.error(error.message || '审核失败');
    }
};

// 显示驳回模态框
App.showRejectModal = function(carId) {
    const modal = this.createModal('审核驳回', `
        <form id="reject-form">
            <div class="form-group">
                <label>驳回原因 <span style="color: red;">*</span></label>
                <textarea id="audit-remark" required style="min-height: 100px;"></textarea>
            </div>
            <div class="btn-group" style="margin-top: 20px;">
                <button type="submit" class="btn btn-danger">确认驳回</button>
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            </div>
        </form>
    `);
    
    document.getElementById('reject-form').onsubmit = async (e) => {
        e.preventDefault();
        const auditRemark = document.getElementById('audit-remark').value;
        if (!auditRemark.trim()) {
            Toast.warning('请填写驳回原因');
            return;
        }
        await this.auditCar(carId, '审核驳回', auditRemark);
        this.closeModal();
    };
};

// 显示创建门店模态框
App.showCreateStoreModal = function() {
    const modal = this.createModal('创建门店', `
        <form id="create-store-form">
            <div class="form-grid">
                <div class="form-group">
                    <label>门店编码 <span style="color: red;">*</span></label>
                    <input type="text" name="store_code" required>
                </div>
                <div class="form-group">
                    <label>门店名称 <span style="color: red;">*</span></label>
                    <input type="text" name="store_name" required>
                </div>
                <div class="form-group full-width">
                    <label>门店位置 <span style="color: red;">*</span></label>
                    <input type="text" name="store_address" required>
                </div>
                <div class="form-group">
                    <label>联系电话 <span style="color: red;">*</span></label>
                    <input type="text" name="store_phone" required>
                </div>
                <div class="form-group full-width">
                    <label>门店描述</label>
                    <textarea name="store_description"></textarea>
                </div>
                <div class="form-group full-width">
                    <label>备注</label>
                    <textarea name="remark"></textarea>
                </div>
            </div>
            <div class="btn-group" style="margin-top: 20px;">
                <button type="submit" class="btn btn-primary">创建</button>
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            </div>
        </form>
    `);
    
    document.getElementById('create-store-form').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            await Store.create(data);
            const message = `门店创建成功！\n\n默认账号：\n录入员：${data.store_code}_luru / 123456\n管理员：${data.store_code}_admin / 123456`;
            Toast.success(message, 5000);
            this.closeModal();
            await this.renderStoreList();
        } catch (error) {
            Toast.error(error.message || '创建失败');
        }
    };
};

// 显示编辑门店模态框
App.showEditStoreModal = async function(storeId) {
    // 保存storeId到全局，供重置密码后刷新使用
    window.currentEditingStoreId = storeId;
    
    const result = await Store.getDetail(storeId);
    const store = result.data;
    const users = store.users || [];
    
    // 获取角色中文名称
    const getRoleName = (role) => {
        const roleMap = {
            'store_input': '录入员',
            'store_admin': '管理员'
        };
        return roleMap[role] || role;
    };
    
    const modal = this.createModal('编辑门店', `
        <form id="edit-store-form">
            <div class="form-grid">
                <div class="form-group">
                    <label>门店编码</label>
                    <input type="text" value="${store.store_code}" disabled>
                </div>
                <div class="form-group">
                    <label>门店名称 <span style="color: red;">*</span></label>
                    <input type="text" name="store_name" value="${store.store_name}" required>
                </div>
                <div class="form-group full-width">
                    <label>门店位置 <span style="color: red;">*</span></label>
                    <input type="text" name="store_address" value="${store.store_address}" required>
                </div>
                <div class="form-group">
                    <label>联系电话 <span style="color: red;">*</span></label>
                    <input type="text" name="store_phone" value="${store.store_phone}" required>
                </div>
                <div class="form-group full-width">
                    <label>门店描述</label>
                    <textarea name="store_description">${store.store_description || ''}</textarea>
                </div>
                <div class="form-group full-width">
                    <label>备注</label>
                    <textarea name="remark">${store.remark || ''}</textarea>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <h4 style="margin-bottom: 15px; color: var(--text-color);">门店账号管理</h4>
                ${users.length === 0 ? `
                    <div class="empty-state" style="padding: 20px;">
                        <p>暂无账号</p>
                    </div>
                ` : `
                    <div class="table-container" style="margin-top: 15px;">
                        <table>
                            <thead>
                                <tr>
                                    <th>用户名</th>
                                    <th>姓名</th>
                                    <th>角色</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.map(user => `
                                    <tr>
                                        <td>${user.username}</td>
                                        <td>${user.real_name || '-'}</td>
                                        <td><span class="badge badge-info">${getRoleName(user.role)}</span></td>
                                        <td><span class="badge ${user.status == 1 ? 'badge-success' : 'badge-danger'}">${user.status == 1 ? '启用' : '禁用'}</span></td>
                                        <td>
                                            <button class="btn btn-warning btn-sm" onclick="App.showResetPasswordModal(${user.id}, '${user.username}', '${getRoleName(user.role)}')">
                                                <i class="fas fa-key"></i> 重置密码
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
            
            <div class="btn-group" style="margin-top: 20px;">
                <button type="submit" class="btn btn-primary">更新门店信息</button>
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            </div>
            <input type="hidden" name="id" value="${storeId}">
        </form>
    `);
    
    document.getElementById('edit-store-form').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            await Store.update(data);
            Toast.success('更新成功');
            this.closeModal();
            await this.renderStoreList();
        } catch (error) {
            Toast.error(error.message || '更新失败');
        }
    };
};

// 显示重置密码模态框
App.showResetPasswordModal = function(userId, username, roleName) {
    const modal = this.createModal('重置密码', `
        <form id="reset-password-form">
            <div class="form-group">
                <label>用户名</label>
                <input type="text" value="${username}" disabled style="background-color: #f5f5f5;">
            </div>
            <div class="form-group">
                <label>角色</label>
                <input type="text" value="${roleName}" disabled style="background-color: #f5f5f5;">
            </div>
            <div class="form-group">
                <label>新密码 <span style="color: red;">*</span></label>
                <input type="password" id="new-password" placeholder="至少6位" required minlength="6" maxlength="20">
                <small style="color: #666; margin-top: 5px; display: block;">密码至少6位</small>
            </div>
            <div class="form-group">
                <label>确认密码 <span style="color: red;">*</span></label>
                <input type="password" id="confirm-password" placeholder="请再次输入新密码" required>
            </div>
            <div class="btn-group" style="margin-top: 20px;">
                <button type="submit" class="btn btn-warning">确认重置</button>
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            </div>
            <input type="hidden" id="reset-user-id" value="${userId}">
        </form>
    `);
    
    document.getElementById('reset-password-form').onsubmit = async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (newPassword !== confirmPassword) {
            Toast.warning('两次输入的密码不一致');
            return;
        }
        
        if (newPassword.length < 6) {
            Toast.warning('密码至少需要6位');
            return;
        }
        
        try {
            await User.resetPassword(userId, newPassword);
            Toast.success(`密码重置成功！\n新密码：${newPassword}`, 5000);
            this.closeModal();
            // 重新打开编辑门店模态框以刷新用户列表
            if (window.currentEditingStoreId) {
                await this.showEditStoreModal(window.currentEditingStoreId);
            }
        } catch (error) {
            Toast.error(error.message || '重置失败');
        }
    };
};

// 删除门店
App.deleteStore = async function(storeId) {
    const confirmed = await Toast.confirm('确定要删除这个门店吗？删除后无法恢复！', '删除门店');
    if (!confirmed) {
        return;
    }
    
    try {
        await Store.delete(storeId);
        Toast.success('删除成功');
        await this.renderStoreList();
    } catch (error) {
        Toast.error(error.message || '删除失败');
    }
};

// 显示授权模态框（整合授权和取消授权功能）
App.showAuthorizeModal = async function(carId, purchaseStoreId) {
    // 获取车源详情，包含已授权门店列表
    const carResult = await Car.getDetail(carId);
    const car = carResult.data;
    // 授权门店列表中的门店ID字段是 authorized_store_id，不是 id
    const authorizedStoreIds = car.authorized_stores ? car.authorized_stores.map(s => s.authorized_store_id || s.id) : [];
    
    const storesResult = await Store.getAll();
    // 排除收车门店（本门店不需要授权给自己）
    const stores = storesResult.data.filter(store => store.id != purchaseStoreId);
    
    if (stores.length === 0) {
        Toast.warning('没有可授权的门店');
        return;
    }
    
    const modal = this.createModal('授权', `
        <form id="authorize-form">
            <div class="form-group">
                <label>选择门店（可多选，已排除收车门店）</label>
                <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 50px;">
                                    <input type="checkbox" id="select-all-stores" style="cursor: pointer;">
                                </th>
                                <th>门店名称</th>
                                <th>门店编号</th>
                                <th>授权状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stores.map(store => {
                                const isAuthorized = authorizedStoreIds.includes(store.id);
                                return `
                                    <tr>
                                        <td style="text-align: center;">
                                            <input type="checkbox" name="store_ids" value="${store.id}" ${isAuthorized ? 'checked' : ''} style="cursor: pointer;" data-initial-state="${isAuthorized ? 'authorized' : 'unauthorized'}">
                                        </td>
                                        <td>${store.store_name || '-'}</td>
                                        <td>${store.store_code || '-'}</td>
                                        <td>
                                            ${isAuthorized ? '<span class="badge badge-success">已授权</span>' : '<span class="badge badge-secondary">未授权</span>'}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <small style="color: var(--text-secondary); margin-top: 8px; display: block;">
                    提示：勾选门店表示授权，取消勾选表示取消授权
                </small>
            </div>
            <div class="btn-group" style="margin-top: 20px;">
                <button type="submit" class="btn btn-primary">确认</button>
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            </div>
        </form>
    `);
    
    // 全选功能
    const selectAllCheckbox = document.getElementById('select-all-stores');
    if (selectAllCheckbox) {
        selectAllCheckbox.onchange = function() {
            const checkboxes = document.querySelectorAll('input[name="store_ids"]');
            checkboxes.forEach(cb => cb.checked = this.checked);
        };
    }
    
    document.getElementById('authorize-form').onsubmit = async (e) => {
        e.preventDefault();
        const checkboxes = document.querySelectorAll('input[name="store_ids"]');
        
        // 找出需要授权的门店（新勾选的）
        const toAuthorize = [];
        // 找出需要取消授权的门店（取消勾选的已授权门店）
        const toRevoke = [];
        
        checkboxes.forEach(cb => {
            const storeId = parseInt(cb.value);
            const isChecked = cb.checked;
            const wasAuthorized = cb.getAttribute('data-initial-state') === 'authorized';
            
            if (isChecked && !wasAuthorized) {
                // 新勾选的未授权门店 -> 需要授权
                toAuthorize.push(storeId);
            } else if (!isChecked && wasAuthorized) {
                // 取消勾选的已授权门店 -> 需要取消授权
                toRevoke.push(storeId);
            }
        });
        
        try {
            // 执行授权操作
            if (toAuthorize.length > 0) {
                await Car.authorize(carId, toAuthorize);
            }
            
            // 执行取消授权操作
            if (toRevoke.length > 0) {
                await Car.revoke(carId, toRevoke);
            }
            
            if (toAuthorize.length > 0 || toRevoke.length > 0) {
                Toast.success('操作成功');
                this.closeModal();
                await this.renderCarList();
            } else {
                Toast.info('没有变更');
            }
        } catch (error) {
            Toast.error(error.message || '操作失败');
        }
    };
};

// 售卖弹窗/动作
App.showSellModal = async function(carId, defaultStoreId = 0) {
    if (this.currentRole === 'headquarters_admin') {
        try {
            const res = await Store.getAll();
            const stores = res.data || [];
            const options = [{ id: 0, store_name: '总部' }].concat(stores.map(s => ({ id: s.id, store_name: s.store_name || '-' })));
            const optsHtml = options.map(o => `<option value="${o.id}" ${String(o.id)===String(defaultStoreId||0)?'selected':''}>${o.store_name}</option>`).join('');
            const modal = this.createModal('售卖', `
                <form id="sell-form">
                    <div class="form-group">
                        <label>选择售卖门店</label>
                        <select id="sell-store-id" class="filter-select">${optsHtml}</select>
                    </div>
                    <div class="btn-group" style="margin-top: 20px;">
                        <button type="submit" class="btn btn-primary">确认售卖</button>
                        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">取消</button>
                    </div>
                </form>
            `);
            const sel = document.getElementById('sell-store-id');
            document.getElementById('sell-form').onsubmit = async (e) => {
                e.preventDefault();
                const sid = parseInt(sel.value || '0', 10) || 0;
                try {
                    await Car.sell(carId, sid);
                    Toast.success('售卖成功');
                    this.closeModal();
                    await this.renderCarList();
                } catch (err) {
                    Toast.error(err.message || '售卖失败');
                }
            };
        } catch (e) {
            Toast.error('加载门店列表失败');
        }
    } else {
        const confirm = await Toast.confirm('确认将该车源标记为已售？', '售卖确认');
        if (!confirm) return;
        try {
            const sid = this.currentUser && this.currentUser.store_id ? this.currentUser.store_id : 0;
            await Car.sell(carId, sid);
            Toast.success('售卖成功');
            await this.renderCarList();
        } catch (e) {
            Toast.error(e.message || '售卖失败');
        }
    }
};

