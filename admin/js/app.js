/**
 * 主应用
 */
const App = {
    currentUser: null,
    currentRole: '',
    
    /**
     * 初始化
     */
    async init() {
        console.log('App.init 开始执行');
        console.log('当前token:', API.token ? '已存在' : '不存在');
        
        // 检查登录状态
        if (!API.token) {
            console.log('没有token，显示登录页面');
            this.showLogin();
            return;
        }
        
        try {
            console.log('有token，获取用户信息...');
            this.currentUser = await Auth.getCurrentUser();
            console.log('获取到用户信息:', this.currentUser);
            this.currentRole = this.currentUser.role;
            this.showMainApp();
            this.initMenu();
            this.loadDefaultPage();
        } catch (error) {
            console.error('Init error:', error);
            this.showLogin();
        }
    },
    
    /**
     * 显示登录页面
     */
    showLogin() {
        document.getElementById('login-page').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
        
        // 绑定登录表单
        const loginForm = document.getElementById('login-form');
        if (!loginForm) {
            console.error('登录表单元素未找到');
            return;
        }
        
        // 移除旧的绑定，避免重复绑定
        loginForm.onsubmit = null;
        
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value;
                const captcha = document.getElementById('captcha').value.trim();
                
                console.log('登录表单提交，用户名:', username);
                
                if (!username || !password) {
                    const msg = '请输入用户名和密码';
                    console.warn(msg);
                    if (typeof Toast !== 'undefined' && Toast.warning) {
                        Toast.warning(msg);
                    } else {
                        alert(msg);
                    }
                    return false;
                }
                
                if (!captcha) {
                    const msg = '请输入验证码';
                    if (typeof Toast !== 'undefined' && Toast.warning) {
                        Toast.warning(msg);
                    } else {
                        alert(msg);
                    }
                    return false;
                }
                
                try {
                    console.log('开始调用Auth.login...');
                    const user = await Auth.login(username, password, captcha);
                console.log('Auth.login返回:', user);
                
                if (!user) {
                    throw new Error('登录响应数据为空');
                }
                
                if (!user.role) {
                    throw new Error('登录响应数据异常：缺少role字段');
                }
                
                console.log('设置用户信息...');
                // 登录后获取完整的用户信息（包含门店名称等）
                this.currentUser = await Auth.getCurrentUser();
                this.currentRole = this.currentUser.role;
                
                console.log('显示主应用...');
                this.showMainApp();
                this.initMenu();
                this.loadDefaultPage();
                
                // 延迟显示成功提示，避免与页面切换冲突
                setTimeout(() => {
                    if (typeof Toast !== 'undefined' && Toast.success) {
                        Toast.success('登录成功');
                    }
                }, 300);
                
                return false;
            } catch (error) {
                console.error('登录错误详情:', error);
                console.error('错误类型:', error.constructor.name);
                console.error('错误消息:', error.message);
                if (error.stack) {
                    console.error('错误堆栈:', error.stack);
                }
                
                const errorMsg = error.message || '登录失败，请检查用户名和密码';
                console.error('显示错误提示:', errorMsg);
                
                // 确保错误提示能显示
                try {
                    if (typeof Toast !== 'undefined' && Toast && Toast.error) {
                        console.log('使用Toast显示错误');
                        Toast.error(errorMsg);
                    } else {
                        console.log('Toast未加载，使用alert');
                        alert(errorMsg);
                    }
                } catch (toastError) {
                    console.error('显示错误提示时出错:', toastError);
                    alert(errorMsg);
                }
                
                return false;
            }
        };
        
        console.log('登录表单绑定完成');
    },
    
    /**
     * 显示主应用
     */
    showMainApp() {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        
        // 显示当前用户信息（机构名称 和 角色名称）
        const roleMap = {
            'headquarters_admin': '总部管理员',
            'store_admin': '门店管理员',
            'store_input': '录入员'
        };
        const roleName = this.currentUser.role_name || roleMap[this.currentUser.role] || this.currentUser.role;
        const storeName = this.currentUser.store_name || '';
        
        // 显示格式：机构名称 + 角色名称
        // 总部：机构="总部"，角色="总部管理员"
        // 门店：机构=门店名称，角色=当前登录人的角色
        if (this.currentRole === 'headquarters_admin') {
            // 总部：机构显示"总部"，角色显示"总部管理员"
            document.getElementById('current-user').textContent = '总部';
            document.getElementById('user-role').textContent = '总部管理员';
        } else {
            // 门店：机构显示门店名称，角色显示当前登录人的角色
            document.getElementById('current-user').textContent = storeName || '门店';
            document.getElementById('user-role').textContent = roleName;
        }
        
        // 绑定退出按钮
        document.getElementById('logout-btn').onclick = async () => {
            const confirmed = await Toast.confirm('确定要退出登录吗？', '退出登录');
            if (confirmed) {
                Auth.logout();
            }
        };
        
        // 绑定修改密码按钮
        document.getElementById('change-password-btn').onclick = () => {
            this.showChangePasswordModal();
        };
    },
    
    /**
     * 初始化菜单
     */
    initMenu() {
        const menuItems = [];
        
        if (this.currentRole === 'headquarters_admin') {
            menuItems.push(
                { icon: 'fa-plus-circle', text: '新增车源', page: 'car-create' },
                { icon: 'fa-clipboard-check', text: '待审核车源', page: 'car-audit' },
                { icon: 'fa-store', text: '门店管理', page: 'store-list' },
                { icon: 'fa-car', text: '车源管理', page: 'car-list' }
            );
        } else if (this.currentRole === 'store_admin') {
            menuItems.push(
                { icon: 'fa-clipboard-check', text: '待审核车源', page: 'car-audit' },
                { icon: 'fa-car', text: '车源管理', page: 'car-list' }
            );
        } else if (this.currentRole === 'store_input') {
            menuItems.push(
                { icon: 'fa-plus-circle', text: '新增车源', page: 'car-create' },
                { icon: 'fa-car', text: '我的车源', page: 'car-list' }
            );
        }
        
        const navMenu = document.getElementById('nav-menu');
        navMenu.innerHTML = menuItems.map(item => `
            <li>
                <a href="#" data-page="${item.page}" class="nav-link">
                    <i class="fas ${item.icon}"></i>
                    ${item.text}
                </a>
            </li>
        `).join('');
        
        // 绑定菜单点击事件
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.loadPage(page);
                
                // 更新激活状态
                navMenu.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            };
        });
    },
    
    /**
     * 加载默认页面
     */
    loadDefaultPage() {
        if (this.currentRole === 'headquarters_admin') {
            this.loadPage('car-list');
        } else if (this.currentRole === 'store_admin') {
            this.loadPage('car-audit');
        } else {
            this.loadPage('car-list');
        }
    },
    
    /**
     * 加载页面
     */
    async loadPage(pageName) {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = '<div class="loading">加载中...</div>';
        
        // 更新菜单选中状态
        const navMenu = document.getElementById('nav-menu');
        if (navMenu) {
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-page') === pageName) {
                    link.classList.add('active');
                }
            });
        }
        
        try {
            switch (pageName) {
                case 'store-list':
                    await this.renderStoreList();
                    break;
                case 'car-list':
                    await this.renderCarList();
                    break;
                case 'car-create':
                    await this.renderCarForm();
                    break;
                case 'car-audit':
                    await this.renderCarAudit();
                    break;
                default:
                    contentArea.innerHTML = '<div class="empty-state">页面不存在</div>';
            }
        } catch (error) {
            console.error('Load page error:', error);
            contentArea.innerHTML = `<div class="empty-state">加载失败: ${error.message}</div>`;
        }
    },
    
    /**
     * 渲染门店列表
     */
    async renderStoreList() {
        document.getElementById('page-title').textContent = '门店管理';
        
        const result = await Store.getList(1, 20);
        const stores = result.data.list;
        
        const html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">门店列表</h3>
                    <button class="btn btn-primary" onclick="App.showCreateStoreModal()">
                        <i class="fas fa-plus"></i> 新增门店
                    </button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>门店编码</th>
                                <th>门店名称</th>
                                <th>门店位置</th>
                                <th>联系电话</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stores.map(store => `
                                <tr>
                                    <td>${store.store_code}</td>
                                    <td>${store.store_name}</td>
                                    <td>${store.store_address}</td>
                                    <td>${store.store_phone}</td>
                                    <td>
                                        <button class="btn btn-secondary" onclick="App.showEditStoreModal(${store.id})">编辑</button>
                                        <button class="btn btn-danger" onclick="App.deleteStore(${store.id})">删除</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    },
    
    /**
     * 渲染车源列表
     */
    async renderCarList(page = 1) {
        document.getElementById('page-title').textContent = '车源管理';
        
        // 在重新渲染前，保存当前筛选条件的值（如果元素存在）
        const savedFilterType = document.getElementById('car-filter-type')?.value;
        const savedKeyword = document.getElementById('car-keyword')?.value || '';
        const savedBrand = document.getElementById('car-brand')?.value || '';
        const savedCarStatus = document.getElementById('car-status')?.value || '';
        const savedAuditStatus = document.getElementById('car-audit-status')?.value || '';
        const savedStoreId = document.getElementById('car-store-id')?.value || '';
        const hasUserSelectedAuditStatus = document.getElementById('car-audit-status')?.hasAttribute('data-user-selected');
        
        // 获取筛选条件（优先使用保存的值，否则使用默认值）
        const filterType = savedFilterType || (this.currentRole === 'store_admin' ? 'all' : 'store');
        const keyword = savedKeyword;
        const brand = savedBrand;
        const carStatus = savedCarStatus;
        
        // 审核状态处理：如果用户已经选择过，使用用户选择的值；否则首次加载时总部默认"审核通过"
        let auditStatus = '';
        if (hasUserSelectedAuditStatus || savedAuditStatus) {
            // 用户已经手动选择过，使用用户选择的值（包括空字符串"全部"）
            auditStatus = savedAuditStatus;
        } else {
            // 首次加载时，如果是总部管理员，默认使用"审核通过"
            auditStatus = this.currentRole === 'headquarters_admin' ? '审核通过' : '';
        }
        
        const storeId = savedStoreId;
        
        const params = {
            page: page,
            limit: 20,
            filter_type: filterType,
            keyword: keyword,
            brand: brand,
            car_status: carStatus,
            audit_status: auditStatus,
            store_id: storeId
        };
        
        const result = await Car.getList(params);
        const cars = result.data.list;
        const total = result.data.total;
        const totalPages = Math.ceil(total / 20);
        
        const html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">车源列表</h3>
                    ${this.currentRole === 'store_input' || this.currentRole === 'headquarters_admin' ? `
                        <button class="btn btn-primary" onclick="App.loadPage('car-create')">
                            <i class="fas fa-plus"></i> 新增车源
                        </button>
                    ` : ''}
                </div>
                
                <!-- 筛选条件 -->
                <div class="filter-bar">
                    ${this.currentRole === 'headquarters_admin' ? `
                        <div class="filter-item">
                            <label>收车门店：</label>
                            <select id="car-store-id" class="filter-select" onchange="App.renderCarList(1)">
                                <option value="">全部门店</option>
                            </select>
                        </div>
                    ` : ''}
                    ${this.currentRole === 'store_admin' ? `
                        <div class="filter-item">
                            <label>来源：</label>
                            <select id="car-filter-type" class="filter-select" onchange="App.renderCarList(1)">
                                <option value="all" ${filterType === 'all' ? 'selected' : ''}>全部</option>
                                <option value="store" ${filterType === 'store' ? 'selected' : ''}>本店</option>
                                <option value="other" ${filterType === 'other' ? 'selected' : ''}>他店</option>
                            </select>
                        </div>
                    ` : ''}
                    <div class="filter-item">
                        <label>关键词：</label>
                        <input type="text" id="car-keyword" class="filter-input" placeholder="车牌/品牌/车型" value="${keyword}">
                    </div>
                    <div class="filter-item">
                        <label>品牌：</label>
                        <input type="text" id="car-brand" class="filter-input" placeholder="品牌" value="${brand}">
                    </div>
                    <div class="filter-item">
                        <label>车源状态：</label>
                        <select id="car-status" class="filter-select" onchange="App.renderCarList(1)">
                            <option value="" ${carStatus === '' ? 'selected' : ''}>全部</option>
                            <option value="收钥匙" ${carStatus === '收钥匙' ? 'selected' : ''}>收钥匙</option>
                            <option value="已过户" ${carStatus === '已过户' ? 'selected' : ''}>已过户</option>
                            <option value="已订" ${carStatus === '已订' ? 'selected' : ''}>已订</option>
                            <option value="已售出" ${carStatus === '已售出' ? 'selected' : ''}>已售出</option>
                        </select>
                    </div>
                    <div class="filter-item">
                        <label>审核状态：</label>
                        <select id="car-audit-status" class="filter-select" onchange="document.getElementById('car-audit-status').setAttribute('data-user-selected', 'true'); App.renderCarList(1)">
                            <option value="" ${auditStatus === '' ? 'selected' : ''}>全部</option>
                            <option value="待审核" ${auditStatus === '待审核' ? 'selected' : ''}>待审核</option>
                            <option value="审核通过" ${auditStatus === '审核通过' ? 'selected' : ''}>审核通过</option>
                            <option value="审核驳回" ${auditStatus === '审核驳回' ? 'selected' : ''}>审核驳回</option>
                        </select>
                    </div>
                       <div class="filter-item">
                           <button class="btn btn-primary" onclick="App.renderCarList(1)">
                               <i class="fas fa-search"></i> 搜索
                           </button>
                       </div>
                </div>
                
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="min-width: 100px;">车牌号</th>
                                <th style="min-width: 150px;">品牌/车型</th>
                                ${this.currentRole === 'headquarters_admin' ? '<th style="min-width: 120px;">收车门店</th>' : ''}
                                <th style="min-width: 100px;">收车价</th>
                                <th style="min-width: 80px;">公里数</th>
                                <th style="min-width: 80px;">年限</th>
                                <th style="min-width: 100px;">车源状态</th>
                                <th style="min-width: 100px;">审核状态</th>
                                ${this.currentRole === 'store_admin' ? '<th style="min-width: 80px;">来源</th>' : ''}
                                <th style="min-width: 150px;">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cars.length === 0 ? `
                                <tr>
                                    <td colspan="${this.currentRole === 'headquarters_admin' ? '10' : this.currentRole === 'store_admin' ? '9' : '7'}" style="text-align: center; padding: 40px;">
                                        <div class="empty-state">
                                            <i class="fas fa-car"></i>
                                            <p>暂无车源数据</p>
                                        </div>
                                    </td>
                                </tr>
                            ` : cars.map(car => `
                                <tr>
                                    <td class="text-nowrap">${car.plate_number || '-'}</td>
                                    <td class="text-nowrap">${(car.brand || '') + ' ' + (car.series || '')}</td>
                                    ${this.currentRole === 'headquarters_admin' ? `
                                        <td class="text-nowrap">${car.store_name || '-'}</td>
                                    ` : ''}
                                    <td class="text-nowrap" style="color: var(--danger-color); font-weight: 600;">¥${car.purchase_price ? parseFloat(car.purchase_price).toLocaleString() : '0'}</td>
                                    <td class="text-nowrap">${car.mileage ? parseFloat(car.mileage).toLocaleString() + '公里' : '-'}</td>
                                    <td class="text-nowrap">${car.years || 0}年</td>
                                    <td class="text-nowrap"><span class="badge badge-info">${car.car_status || '-'}</span></td>
                                    <td class="text-nowrap"><span class="badge ${car.audit_status === '审核通过' ? 'badge-success' : car.audit_status === '审核驳回' ? 'badge-danger' : 'badge-warning'}">${car.audit_status || '-'}</span></td>
                                    ${this.currentRole === 'store_admin' ? `
                                        <td class="text-nowrap">${car.is_authorized ? `<span class="badge badge-warning">他店</span>` : '<span class="badge badge-info">本店</span>'}</td>
                                    ` : ''}
                                    <td class="text-nowrap">
                                        <button class="btn btn-sm btn-secondary" onclick="App.showCarDetail(${car.id})">详情</button>
                                        ${this.currentRole === 'store_input' && (car.audit_status === '待审核' || car.audit_status === '审核驳回') ? `
                                            <button class="btn btn-sm btn-warning" onclick="App.showEditCarForm(${car.id})">编辑</button>
                                        ` : ''}
                                        ${this.currentRole === 'headquarters_admin' && car.audit_status === '审核通过' ? `
                                            <button class="btn btn-sm btn-primary" onclick="App.showAuthorizeModal(${car.id}, ${car.store_id})">授权</button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <!-- 分页组件 -->
                ${totalPages > 1 ? `
                    <div class="pagination">
                        <button class="btn btn-sm ${page <= 1 ? 'btn-disabled' : 'btn-secondary'}" 
                                onclick="${page > 1 ? `App.renderCarList(${page - 1})` : ''}" 
                                ${page <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left"></i> 上一页
                        </button>
                        <span class="pagination-info">
                            第 ${page} / ${totalPages} 页，共 ${total} 条
                        </span>
                        <button class="btn btn-sm ${page >= totalPages ? 'btn-disabled' : 'btn-secondary'}" 
                                onclick="${page < totalPages ? `App.renderCarList(${page + 1})` : ''}" 
                                ${page >= totalPages ? 'disabled' : ''}>
                            下一页 <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                ` : total > 0 ? `
                    <div class="pagination">
                        <span class="pagination-info">共 ${total} 条数据</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
        
        // 如果是总部管理员，加载门店列表
        if (this.currentRole === 'headquarters_admin') {
            this.loadStoreOptionsForFilter();
        }
        
        // 设置筛选条件的值
        if (document.getElementById('car-filter-type')) {
            document.getElementById('car-filter-type').value = filterType;
        }
        if (document.getElementById('car-status')) {
            document.getElementById('car-status').value = carStatus;
        }
        if (document.getElementById('car-audit-status')) {
            const auditStatusSelect = document.getElementById('car-audit-status');
            auditStatusSelect.value = auditStatus;
            // 如果用户已经选择过，或者当前有值，标记为用户已选择（避免首次加载时被覆盖）
            if (hasUserSelectedAuditStatus || auditStatus) {
                auditStatusSelect.setAttribute('data-user-selected', 'true');
            }
        }
        if (document.getElementById('car-store-id')) {
            document.getElementById('car-store-id').value = storeId;
        }
        
        // 绑定搜索按钮
        const searchBtn = document.querySelector('.filter-bar .btn-primary');
        if (searchBtn) {
            searchBtn.onclick = () => App.renderCarList(1);
        }
    },
    
    /**
     * 加载门店选项（用于筛选）
     */
    async loadStoreOptionsForFilter() {
        try {
            const result = await Store.getAll();
            const stores = result.data;
            const select = document.getElementById('car-store-id');
            if (select) {
                select.innerHTML = '<option value="">全部门店</option>' + 
                    stores.map(store => `<option value="${store.id}">${store.store_name}</option>`).join('');
            }
        } catch (error) {
            console.error('加载门店列表失败:', error);
        }
    },
    
    /**
     * 重置车源筛选条件
     */
    resetCarFilters() {
        if (document.getElementById('car-keyword')) document.getElementById('car-keyword').value = '';
        if (document.getElementById('car-brand')) document.getElementById('car-brand').value = '';
        if (document.getElementById('car-status')) document.getElementById('car-status').value = '';
        if (document.getElementById('car-audit-status')) document.getElementById('car-audit-status').value = '';
        if (document.getElementById('car-store-id')) document.getElementById('car-store-id').value = '';
        if (document.getElementById('car-filter-type')) document.getElementById('car-filter-type').value = 'all';
        this.renderCarList(1);
    },
    
    
    /**
     * 渲染车源表单
     */
    async renderCarForm(carId = null) {
        document.getElementById('page-title').textContent = carId ? '编辑车源' : '新增车源';
        
        let car = null;
        if (carId) {
            const result = await Car.getDetail(carId);
            car = result.data;
        }
        
        const html = `
            <div class="card">
                <form id="car-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>品牌 <span style="color: red;">*</span></label>
                            <input type="text" name="brand" value="${car ? car.brand : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>车型/车系 <span style="color: red;">*</span></label>
                            <input type="text" name="series" value="${car ? car.series : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>车辆型号</label>
                            <input type="text" name="model" value="${car ? car.model : ''}">
                        </div>
                        <div class="form-group">
                            <label>颜色 <span style="color: red;">*</span></label>
                            <input type="text" name="color" value="${car ? car.color : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>首次上牌时间 <span style="color: red;">*</span></label>
                            <input type="date" name="first_register_time" value="${car ? car.first_register_time : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>车架号 <span style="color: red;">*</span></label>
                            <input type="text" name="vin" value="${car ? car.vin : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>车牌号 <span style="color: red;">*</span></label>
                            <input type="text" name="plate_number" value="${car ? car.plate_number : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>公里数 <span style="color: red;">*</span></label>
                            <input type="number" name="mileage" value="${car ? car.mileage : ''}" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>收车价（元） <span style="color: red;">*</span></label>
                            <input type="number" name="purchase_price" value="${car ? car.purchase_price : ''}" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>车源状态 <span style="color: red;">*</span></label>
                            <select name="car_status" required>
                                <option value="收钥匙" ${car && car.car_status === '收钥匙' ? 'selected' : ''}>收钥匙</option>
                                <option value="已过户" ${car && car.car_status === '已过户' ? 'selected' : ''}>已过户</option>
                                <option value="已订" ${car && car.car_status === '已订' ? 'selected' : ''}>已订</option>
                                <option value="已售出" ${car && car.car_status === '已售出' ? 'selected' : ''}>已售出</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>排量（L）</label>
                            <input type="text" name="displacement" value="${car ? car.displacement : ''}">
                        </div>
                        <div class="form-group">
                            <label>变速箱类型</label>
                            <select name="transmission">
                                <option value="">请选择</option>
                                <option value="手动" ${car && car.transmission === '手动' ? 'selected' : ''}>手动</option>
                                <option value="自动" ${car && car.transmission === '自动' ? 'selected' : ''}>自动</option>
                                <option value="手自一体" ${car && car.transmission === '手自一体' ? 'selected' : ''}>手自一体</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>燃料类型</label>
                            <select name="fuel_type">
                                <option value="">请选择</option>
                                <option value="汽油" ${car && car.fuel_type === '汽油' ? 'selected' : ''}>汽油</option>
                                <option value="柴油" ${car && car.fuel_type === '柴油' ? 'selected' : ''}>柴油</option>
                                <option value="混动" ${car && car.fuel_type === '混动' ? 'selected' : ''}>混动</option>
                                <option value="电动" ${car && car.fuel_type === '电动' ? 'selected' : ''}>电动</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>排放标准</label>
                            <select name="emission_standard">
                                <option value="">请选择</option>
                                <option value="国四" ${car && car.emission_standard === '国四' ? 'selected' : ''}>国四</option>
                                <option value="国五" ${car && car.emission_standard === '国五' ? 'selected' : ''}>国五</option>
                                <option value="国六" ${car && car.emission_standard === '国六' ? 'selected' : ''}>国六</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>过户次数</label>
                            <input type="number" name="transfer_count" value="${car ? car.transfer_count : 0}" min="0">
                        </div>
                        <div class="form-group">
                            <label>保险到期时间</label>
                            <input type="date" name="insurance_expire_time" value="${car && car.insurance_expire_time ? car.insurance_expire_time : ''}">
                        </div>
                        <div class="form-group">
                            <label>年检到期时间</label>
                            <input type="date" name="inspection_expire_time" value="${car && car.inspection_expire_time ? car.inspection_expire_time : ''}">
                        </div>
                        <div class="form-group">
                            <label>事故记录</label>
                            <select name="accident_record">
                                <option value="">请选择</option>
                                <option value="无事故" ${car && car.accident_record === '无事故' ? 'selected' : ''}>无事故</option>
                                <option value="轻微事故" ${car && car.accident_record === '轻微事故' ? 'selected' : ''}>轻微事故</option>
                                <option value="重大事故" ${car && car.accident_record === '重大事故' ? 'selected' : ''}>重大事故</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label>车况描述 <span style="color: red;">*</span></label>
                            <textarea name="condition_description" required>${car ? car.condition_description : ''}</textarea>
                        </div>
                        <div class="form-group full-width">
                            <label>维修记录</label>
                            <textarea name="maintenance_record">${car ? car.maintenance_record : ''}</textarea>
                        </div>
                        <div class="form-group full-width">
                            <label>备注</label>
                            <textarea name="remark">${car ? car.remark : ''}</textarea>
                        </div>
                        <div class="form-group full-width">
                            <label>车辆照片 <span style="color: red;">*</span>（至少3张）</label>
                            <div class="image-upload" id="car-images-upload">
                                ${car && car.images ? car.images.filter(img => img.image_type === 'car').map(img => `
                                    <div class="image-item">
                                        <img src="${img.image_url}" alt="车辆照片">
                                        <button type="button" class="remove-btn" onclick="App.removeImage(this, '${img.image_url}')">&times;</button>
                                    </div>
                                `).join('') : ''}
                                <div class="upload-btn" onclick="document.getElementById('car-image-input').click()">
                                    <i class="fas fa-plus" style="font-size: 24px; color: var(--text-secondary);"></i>
                                </div>
                            </div>
                            <input type="file" id="car-image-input" multiple accept="image/*" style="display: none;" onchange="App.handleImageUpload(this, 'car')">
                        </div>
                        <div class="form-group full-width">
                            <label>绿本照片 <span style="color: red;">*</span>（至少1张）</label>
                            <div class="image-upload" id="greenbook-images-upload">
                                ${car && car.images ? car.images.filter(img => img.image_type === 'green_book').map(img => `
                                    <div class="image-item">
                                        <img src="${img.image_url}" alt="绿本照片">
                                        <button type="button" class="remove-btn" onclick="App.removeImage(this, '${img.image_url}')">&times;</button>
                                    </div>
                                `).join('') : ''}
                                <div class="upload-btn" onclick="document.getElementById('greenbook-image-input').click()">
                                    <i class="fas fa-plus" style="font-size: 24px; color: var(--text-secondary);"></i>
                                </div>
                            </div>
                            <input type="file" id="greenbook-image-input" multiple accept="image/*" style="display: none;" onchange="App.handleImageUpload(this, 'green_book')">
                        </div>
                    </div>
                    <div class="btn-group" style="margin-top: 24px;">
                        <button type="submit" class="btn btn-primary">${carId ? '更新' : '提交审核'}</button>
                        <button type="button" class="btn btn-secondary" onclick="App.loadPage('car-list')">取消</button>
                    </div>
                    ${carId ? `<input type="hidden" name="id" value="${carId}">` : ''}
                </form>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
        
        // 绑定表单提交
        document.getElementById('car-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            // 收集图片URL
            const carImages = Array.from(document.querySelectorAll('#car-images-upload .image-item img')).map(img => img.src.replace(window.location.origin, ''));
            const greenBookImages = Array.from(document.querySelectorAll('#greenbook-images-upload .image-item img')).map(img => img.src.replace(window.location.origin, ''));
            
            data.car_images = JSON.stringify(carImages);
            data.green_book_images = JSON.stringify(greenBookImages);
            
            try {
                if (carId) {
                    await Car.update(data);
                    Toast.success('更新成功');
                } else {
                    await Car.create(data);
                    Toast.success('提交成功');
                }
                this.loadPage('car-list');
            } catch (error) {
                Toast.error(error.message || '操作失败');
            }
        };
    },
    
    /**
     * 显示编辑车源表单
     */
    async showEditCarForm(carId) {
        await this.renderCarForm(carId);
    },
    
    /**
     * 处理图片上传
     */
    async handleImageUpload(input, type) {
        const files = Array.from(input.files);
        const uploadContainer = type === 'green_book' ? document.getElementById('greenbook-images-upload') : document.getElementById('car-images-upload');
        
        for (const file of files) {
            try {
                const result = await API.upload('/upload/image', file, type);
                const imageUrl = result.data.url;
                
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.innerHTML = `
                    <img src="${imageUrl}" alt="${type === 'green_book' ? '绿本照片' : '车辆照片'}">
                    <button type="button" class="remove-btn" onclick="App.removeImage(this, '${imageUrl}')">&times;</button>
                `;
                
                // 插入到上传按钮之前
                const uploadBtn = uploadContainer.querySelector('.upload-btn');
                uploadContainer.insertBefore(imageItem, uploadBtn);
            } catch (error) {
                Toast.error(error.message || '上传失败');
            }
        }
        
        input.value = '';
    },
    
    /**
     * 移除图片
     */
    async removeImage(btn, imageUrl) {
        const confirmed = await Toast.confirm('确定要删除这张图片吗？', '删除图片');
        if (confirmed) {
            btn.closest('.image-item').remove();
        }
    },
    
    /**
     * 显示车源详情
     */
    async showCarDetail(id) {
        const result = await Car.getDetail(id);
        const car = result.data;
        
        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            return dateStr;
        };
        
        const formatPrice = (price) => {
            return price ? `¥${parseFloat(price).toLocaleString()}` : '-';
        };
        
        const modal = this.createModal('车源详情', `
            <div style="max-height: 75vh; overflow-y: auto; padding: 8px;">
                <div class="detail-section">
                    <h4 class="detail-section-title">基本信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">车牌号：</span>
                            <span class="detail-value">${car.plate_number || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">品牌：</span>
                            <span class="detail-value">${car.brand || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">车型/车系：</span>
                            <span class="detail-value">${car.series || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">车辆型号：</span>
                            <span class="detail-value">${car.model || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">颜色：</span>
                            <span class="detail-value">${car.color || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">首次上牌时间：</span>
                            <span class="detail-value">${formatDate(car.first_register_time)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">年限：</span>
                            <span class="detail-value">${car.years || 0}年</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">车架号(VIN)：</span>
                            <span class="detail-value" style="word-break: break-all;">${car.vin || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">公里数：</span>
                            <span class="detail-value">${car.mileage ? parseFloat(car.mileage).toLocaleString() + '公里' : '-'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4 class="detail-section-title">车辆参数</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">排量：</span>
                            <span class="detail-value">${car.displacement || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">变速箱：</span>
                            <span class="detail-value">${car.transmission || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">燃料类型：</span>
                            <span class="detail-value">${car.fuel_type || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">排放标准：</span>
                            <span class="detail-value">${car.emission_standard || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">过户次数：</span>
                            <span class="detail-value">${car.transfer_count || 0}次</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">保险到期：</span>
                            <span class="detail-value">${formatDate(car.insurance_expire_time)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">年检到期：</span>
                            <span class="detail-value">${formatDate(car.inspection_expire_time)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">事故记录：</span>
                            <span class="detail-value">${car.accident_record || '无'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4 class="detail-section-title">收车信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">收车门店：</span>
                            <span class="detail-value">${car.store_name || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">门店电话：</span>
                            <span class="detail-value">${car.store_phone || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">录入人员：</span>
                            <span class="detail-value">${car.input_user_name || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">收车价：</span>
                            <span class="detail-value" style="color: var(--danger-color); font-weight: 600;">${formatPrice(car.purchase_price)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">收车时间：</span>
                            <span class="detail-value">${car.purchase_time ? new Date(car.purchase_time * 1000).toLocaleString('zh-CN') : '-'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4 class="detail-section-title">状态信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">车源状态：</span>
                            <span class="detail-value"><span class="badge badge-info">${car.car_status || '-'}</span></span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">审核状态：</span>
                            <span class="detail-value"><span class="badge ${car.audit_status === '审核通过' ? 'badge-success' : car.audit_status === '审核驳回' ? 'badge-danger' : 'badge-warning'}">${car.audit_status || '-'}</span></span>
                        </div>
                        ${car.audit_user_id ? `
                            <div class="detail-item">
                                <span class="detail-label">审核时间：</span>
                                <span class="detail-value">${car.audit_time ? new Date(car.audit_time * 1000).toLocaleString('zh-CN') : '-'}</span>
                            </div>
                        ` : ''}
                        ${car.audit_remark ? `
                            <div class="detail-item full-width">
                                <span class="detail-label">审核意见：</span>
                                <span class="detail-value">${car.audit_remark}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${car.condition_description ? `
                    <div class="detail-section">
                        <h4 class="detail-section-title">车况描述</h4>
                        <div class="detail-text">${car.condition_description}</div>
                    </div>
                ` : ''}
                
                ${car.maintenance_record ? `
                    <div class="detail-section">
                        <h4 class="detail-section-title">维修记录</h4>
                        <div class="detail-text">${car.maintenance_record}</div>
                    </div>
                ` : ''}
                
                ${car.car_config ? `
                    <div class="detail-section">
                        <h4 class="detail-section-title">车辆配置</h4>
                        <div class="detail-text">${car.car_config}</div>
                    </div>
                ` : ''}
                
                ${car.remark ? `
                    <div class="detail-section">
                        <h4 class="detail-section-title">备注</h4>
                        <div class="detail-text">${car.remark}</div>
                    </div>
                ` : ''}
                
                ${car.images && car.images.length > 0 ? `
                    <div class="detail-section">
                        <h4 class="detail-section-title">车辆照片</h4>
                        <div class="image-gallery">
                            ${car.images.filter(img => img.image_type === 'car').map(img => `
                                <div class="gallery-item">
                                    <img src="${img.image_url}" alt="车辆照片" onclick="window.open('${img.image_url}', '_blank')">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ${car.images.filter(img => img.image_type === 'green_book').length > 0 ? `
                        <div class="detail-section">
                            <h4 class="detail-section-title">绿本照片</h4>
                            <div class="image-gallery">
                                ${car.images.filter(img => img.image_type === 'green_book').map(img => `
                                    <div class="gallery-item">
                                        <img src="${img.image_url}" alt="绿本照片" onclick="window.open('${img.image_url}', '_blank')">
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                ` : ''}
                
                ${this.currentRole === 'headquarters_admin' && car.audit_status === '审核通过' ? `
                    <div class="detail-section" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                        <button class="btn btn-primary" onclick="App.showAuthorizeModal(${car.id}, ${car.store_id})">授权</button>
                    </div>
                ` : ''}
            </div>
        `);
    },
    
    /**
     * 显示修改密码模态框
     */
    showChangePasswordModal() {
        const modal = this.createModal('修改密码', `
            <form id="change-password-form">
                <div class="form-group">
                    <label>原密码</label>
                    <input type="password" id="old-password" required>
                </div>
                <div class="form-group">
                    <label>新密码 <small style="color: #999;">(至少6位)</small></label>
                    <input type="password" id="new-password" required minlength="6" maxlength="20">
                </div>
                <div class="form-group">
                    <label>确认新密码</label>
                    <input type="password" id="confirm-new-password" required minlength="6" maxlength="20">
                </div>
                <div class="btn-group">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">确定</button>
                </div>
            </form>
        `);
        
        document.getElementById('change-password-form').onsubmit = async (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('old-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmNewPassword = document.getElementById('confirm-new-password').value;
            
            if (!oldPassword || !newPassword || !confirmNewPassword) {
                Toast.warning('请填写完整信息');
                return;
            }
            
            if (newPassword.length < 6) {
                Toast.warning('新密码至少需要6位');
                return;
            }
            
            if (newPassword !== confirmNewPassword) {
                Toast.warning('两次输入的新密码不一致');
                return;
            }
            
            try {
                await User.changePassword(oldPassword, newPassword);
                Toast.success('密码修改成功');
                this.closeModal();
            } catch (error) {
                Toast.error(error.message || '修改失败');
            }
        };
    },
    
    /**
     * 创建模态框
     */
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="App.closeModal()">&times;</button>
                </div>
                ${content}
            </div>
        `;
        
        document.getElementById('modal-container').innerHTML = '';
        document.getElementById('modal-container').appendChild(modal);
        
        return modal;
    },
    
    /**
     * 关闭模态框
     */
    closeModal() {
        document.getElementById('modal-container').innerHTML = '';
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});