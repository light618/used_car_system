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

        // 首次登录新手引导
        try {
            const done = localStorage.getItem('onboarding_done');
            if (!done && typeof App.showOnboarding === 'function') {
                App.showOnboarding();
            }
        } catch (e) {}
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
                { icon: 'fa-car', text: '车源管理', page: 'car-list' },
                { icon: 'fa-book', text: '新手指引', page: 'guide' }
            );
        } else if (this.currentRole === 'store_admin') {
            menuItems.push(
                { icon: 'fa-clipboard-check', text: '待审核车源', page: 'car-audit' },
                { icon: 'fa-car', text: '车源管理', page: 'car-list' },
                { icon: 'fa-book', text: '新手指引', page: 'guide' }
            );
        } else if (this.currentRole === 'store_input') {
            menuItems.push(
                { icon: 'fa-plus-circle', text: '新增车源', page: 'car-create' },
                { icon: 'fa-car', text: '我的车源', page: 'car-list' },
                { icon: 'fa-book', text: '新手指引', page: 'guide' }
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
        contentArea.innerHTML = this.renderSkeleton(pageName);
        
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
                case 'guide':
                    await this.renderGuide();
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
     * 渲染新手指引
     */
    async renderGuide() {
        document.getElementById('page-title').textContent = '新手指引';
        const isHeadquarters = this.currentRole === 'headquarters_admin';
        const html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${isHeadquarters ? '总部管理员' : '门店管理员'}新手指引</h3>
                </div>
                <div class="card-body">
                    <!-- 业务流程横向流程图 -->
                    <div style="margin-bottom: 32px;">
                        <h4 style="color: var(--primary-color); margin-bottom: 20px; font-size: 18px;">📋 业务流程</h4>
                        <div class="process-flow">
                            <div class="process-step">
                                <div class="process-step-number">1</div>
                                <div class="process-step-title">门店录入车源</div>
                                <div class="process-step-desc">门店管理员或录入员在"新增车源"中录入车辆信息</div>
                            </div>
                            <div class="process-arrow">→</div>
                            <div class="process-step">
                                <div class="process-step-number">2</div>
                                <div class="process-step-title">门店审核上架</div>
                                <div class="process-step-desc">门店管理员在"待审核车源"中审核并上架车源</div>
                            </div>
                            <div class="process-arrow">→</div>
                            <div class="process-step">
                                <div class="process-step-number">3</div>
                                <div class="process-step-title">总部授权门店</div>
                                <div class="process-step-desc">总部在"车源管理"中将车源授权给其他门店</div>
                            </div>
                            <div class="process-arrow">→</div>
                            <div class="process-step">
                                <div class="process-step-number">4</div>
                                <div class="process-step-title">门店预定/售卖</div>
                                <div class="process-step-desc">门店可以对可见的车源进行预定或直接售卖</div>
                            </div>
                            <div class="process-arrow">→</div>
                            <div class="process-step">
                                <div class="process-step-number">5</div>
                                <div class="process-step-title">售出标记</div>
                                <div class="process-step-desc">完成售卖后，车源状态自动更新为"已售出"</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 初始化设置 -->
                    <div style="margin-bottom: 24px;">
                        <h4 style="color: var(--primary-color); margin-bottom: 16px; font-size: 18px;">⚙️ 初始化设置</h4>
                        <ol class="guide-steps">
                            ${isHeadquarters ? `
                            <li>
                                <strong>创建门店与账号：</strong> 进入"门店管理"，新增门店；在"门店详情"中为门店创建管理员/录入员账号。
                            </li>
                            ` : `
                            <li>
                                <strong>门店账号设置：</strong> 门店账号由总部管理员创建，门店管理员登录后可进行车源管理操作。
                            </li>
                            `}
                        </ol>
                    </div>
                    
                    <!-- 业务功能 -->
                    <div style="margin-bottom: 32px;">
                        <h4 style="color: var(--primary-color); margin-bottom: 16px; font-size: 18px;">🔄 业务功能</h4>
                        <ol class="guide-steps">
                            <li>
                                <strong>门店录入车源：</strong> 门店管理员或录入员登录后，进入"新增车源"录入车辆信息并提交审核。
                                <button class="btn btn-sm btn-outline" style="margin-left: 12px; padding: 6px 16px;" onclick="App.startOnboarding('car-create', 'create')">开始体验</button>
                            </li>
                            <li>
                                <strong>门店审核上架：</strong> 门店管理员在"待审核车源"中审核门店提交的车源，审核通过后车源状态变为"待出售"。
                                <button class="btn btn-sm btn-outline" style="margin-left: 12px; padding: 6px 16px;" onclick="App.startOnboarding('car-audit', 'audit')">开始体验</button>
                            </li>
                            ${isHeadquarters ? `
                            <li>
                                <strong>授权给门店：</strong> 在"车源管理"中点击"授权"，在弹窗勾选需要可见该车的门店，支持批量授权/取消授权。
                                <button class="btn btn-sm btn-outline" style="margin-left: 12px; padding: 6px 16px;" onclick="App.startOnboarding('car-list', 'authorize')">开始体验</button>
                            </li>
                            ` : ''}
                            <li>
                                <strong>预定车源：</strong> 待出售状态的车源，总部和门店都可以进行预定，预定后车源状态变为"已预定"，只有预定方可以取消预定或售卖。
                                <button class="btn btn-sm btn-outline" style="margin-left: 12px; padding: 6px 16px;" onclick="App.startOnboarding('car-list', 'reserve')">开始体验</button>
                            </li>
                            <li>
                                <strong>售卖车源：</strong> 待出售或已预定（仅预定方）的车源，可以点击"售卖"完成售出登记；总部可选择售卖门店。
                                <button class="btn btn-sm btn-outline" style="margin-left: 12px; padding: 6px 16px;" onclick="App.startOnboarding('car-list', 'sell')">开始体验</button>
                            </li>
                        </ol>
                    </div>
                    
                    <!-- 完整流程体验入口暂时屏蔽 -->
                </div>
            </div>
        `;
        document.getElementById('content-area').innerHTML = html;
    },
    
    /**
     * 开始新手指引（页面切换式）
     */
    async startOnboarding(pageName, action = null) {
        // 关闭当前可能存在的指引遮罩
        this.closeOnboarding();
        
        // 导航到目标页面
        await this.loadPage(pageName);
        
        // 等待页面渲染完成
        setTimeout(() => {
            this.showOnboardingHighlight(pageName, action);
        }, 300);
    },
    
    /**
     * 开始完整流程引导
     */
    async startOnboardingFlow() {
        this.onboardingMode = true; // 标记为引导模式
        this.onboardingStep = 0;
        // 全流程从门店录入车源信息开始
        this.onboardingSteps = this.currentRole === 'headquarters_admin' ? [
            { page: 'car-create', action: 'create', message: '第一步：门店录入车源。填写车辆信息，完成后点击"提交审核"。' },
            { page: 'car-audit', action: 'audit', message: '第二步：门店审核上架。点击"通过"按钮审核车源。' },
            { page: 'car-list', action: 'authorize', message: '第三步：总部授权门店。点击"授权"按钮将车源授权给其他门店。' },
            { page: 'car-list', action: 'reserve', message: '第四步：门店预定车源。点击"预定"按钮预定车源。' },
            { page: 'car-list', action: 'sell', message: '第五步：售卖车源。点击"售卖"按钮完成售出登记。' }
        ] : [
            { page: 'car-create', action: 'create', message: '第一步：门店录入车源。填写车辆信息，完成后点击"提交审核"。' },
            { page: 'car-audit', action: 'audit', message: '第二步：门店审核上架。点击"通过"按钮审核车源。' },
            { page: 'car-list', action: 'reserve', message: '第三步：门店预定车源。点击"预定"按钮预定车源。' },
            { page: 'car-list', action: 'sell', message: '第四步：售卖车源。点击"售卖"按钮完成售出登记。' }
        ];
        
        await this.nextOnboardingStep();
    },
    
    /**
     * 下一步引导
     */
    async nextOnboardingStep() {
        if (this.onboardingStep >= this.onboardingSteps.length) {
            this.endOnboardingFlow();
            return;
        }
        
        const step = this.onboardingSteps[this.onboardingStep];
        
        // 先高亮左侧菜单入口（等待2秒后自动继续）
        await this.highlightMenuEntry(step.page);
        
        // 关闭菜单高亮遮罩
        this.closeOnboarding();
        
        // 加载页面
        await this.loadOnboardingPage(step.page, step.action);
        
        // 等待页面渲染后显示高亮和步骤信息
        setTimeout(() => {
            try {
                // 如果是表单页面，先滚动到底部
                if (step.page === 'car-create') {
                    const submitButton = document.querySelector('#mock-submit-btn') ||
                                       document.querySelector('form#car-form button[type="submit"]') ||
                                       document.querySelector('form#car-form .btn-primary') ||
                                       document.querySelector('.btn-group .btn-primary');
                    if (submitButton) {
                        // 先滚动到按钮位置
                        submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // 等待滚动完成后再显示高亮和步骤信息
                        setTimeout(() => {
                            // 先显示步骤信息，确保用户能看到
                            this.showOnboardingStepInfo(step);
                            // 然后显示高亮
                            setTimeout(() => {
                                try {
                                    this.showOnboardingHighlight(step.page, step.action);
                                } catch (error) {
                                    console.error('显示引导高亮失败:', error);
                                }
                            }, 100);
                        }, 600);
                    } else {
                        // 如果找不到按钮，延迟再试
                        setTimeout(() => {
                            // 先显示步骤信息，确保用户能看到
                            this.showOnboardingStepInfo(step);
                            // 然后显示高亮
                            setTimeout(() => {
                                try {
                                    this.showOnboardingHighlight(step.page, step.action);
                                } catch (error) {
                                    console.error('显示引导高亮失败:', error);
                                }
                            }, 100);
                        }, 500);
                    }
                } else {
                    // 非表单页面先显示步骤信息，再显示高亮
                    this.showOnboardingStepInfo(step);
                    setTimeout(() => {
                        try {
                            this.showOnboardingHighlight(step.page, step.action);
                        } catch (error) {
                            console.error('显示引导高亮失败:', error);
                        }
                    }, 100);
                }
            } catch (error) {
                console.error('显示引导失败:', error);
                // 即使高亮失败，也要显示步骤信息
                try {
                    this.showOnboardingStepInfo(step);
                } catch (e) {
                    console.error('显示步骤信息也失败:', e);
                }
            }
        }, 1000);
    },
    
    /**
     * 高亮左侧菜单入口
     */
    async highlightMenuEntry(pageName) {
        return new Promise((resolve) => {
            // 关闭当前遮罩
            this.closeOnboarding();
            
            // 创建菜单高亮遮罩
            const overlay = document.createElement('div');
            overlay.id = 'onboarding-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.15);
                z-index: 9999;
            `;
            
            // 查找对应的菜单项
            const menuItem = document.querySelector(`.nav-link[data-page="${pageName}"]`);
            if (menuItem) {
                // 滚动到菜单项可见
                menuItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => {
                    const rect = menuItem.getBoundingClientRect();
                    const highlight = document.createElement('div');
                    highlight.style.cssText = `
                        position: fixed;
                        top: ${rect.top}px;
                        left: ${rect.left}px;
                        width: ${rect.width}px;
                        height: ${rect.height}px;
                        border: 3px solid var(--primary-color);
                        border-radius: 8px;
                        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.15), 0 0 20px rgba(59, 130, 246, 0.5);
                        z-index: 10000;
                        pointer-events: none;
                        animation: pulse 2s infinite;
                    `;
                    
                    const tooltip = document.createElement('div');
                    tooltip.style.cssText = `
                        position: fixed;
                        top: ${rect.bottom + 20}px;
                        left: ${Math.max(20, rect.left)}px;
                        background: white;
                        padding: 12px 16px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        z-index: 10001;
                        font-size: 14px;
                        color: var(--text-primary);
                        max-width: 250px;
                    `;
                    tooltip.innerHTML = `
                        <div style="font-weight: 600; color: var(--primary-color);">📍 菜单导航</div>
                        <div style="margin-top: 4px;">系统将自动跳转到此页面</div>
                    `;
                    
                    overlay.appendChild(highlight);
                    overlay.appendChild(tooltip);
                    document.body.appendChild(overlay);
                    
                    // 2秒后自动继续
                    setTimeout(() => {
                        resolve();
                    }, 2000);
                }, 300);
            } else {
                // 如果找不到菜单项，直接继续
                resolve();
            }
        });
    },
    
    /**
     * 加载引导模式页面（使用mock数据）
     */
    async loadOnboardingPage(pageName, action) {
        const contentArea = document.getElementById('content-area');
        
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
        
        // 根据页面类型渲染mock数据
        switch (pageName) {
            case 'store-list':
                contentArea.innerHTML = this.renderMockStoreList();
                break;
            case 'car-create':
                contentArea.innerHTML = this.renderMockCarForm();
                break;
            case 'car-audit':
                contentArea.innerHTML = this.renderMockCarAudit();
                break;
            case 'car-list':
                contentArea.innerHTML = this.renderMockCarList(action);
                break;
        }
    },
    
    /**
     * 显示步骤信息卡片
     */
    showOnboardingStepInfo(step) {
        // 移除旧的步骤信息
        const oldStepInfo = document.querySelector('.onboarding-step-info');
        if (oldStepInfo) oldStepInfo.remove();
        
        // 确保步骤信息正确
        if (!this.onboardingSteps || this.onboardingSteps.length === 0) {
            console.error('引导步骤未初始化', this.onboardingSteps);
            return;
        }
        
        const currentStep = this.onboardingStep !== null && this.onboardingStep !== undefined ? this.onboardingStep : 0;
        const totalSteps = this.onboardingSteps.length;
        const isLastStep = currentStep >= totalSteps - 1;
        
        const stepInfo = document.createElement('div');
        stepInfo.className = 'onboarding-step-info';
        stepInfo.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: white !important;
            padding: 20px !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
            z-index: 99999 !important;
            max-width: 320px !important;
            font-size: 14px !important;
            line-height: 1.6 !important;
            color: var(--text-primary) !important;
            pointer-events: auto !important;
        `;
        
        stepInfo.innerHTML = `
            <div style="margin-bottom: 12px; font-weight: 600; color: var(--primary-color); font-size: 16px;">
                步骤 ${currentStep + 1} / ${totalSteps}
            </div>
            <div style="margin-bottom: 16px; color: var(--text-primary);">${step.message || '请按照提示进行操作'}</div>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                ${currentStep > 0 ? `
                <button onclick="App.prevOnboardingStep()" style="flex: 1; padding: 10px; background: var(--bg-secondary); color: var(--text-primary); border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">上一步</button>
                ` : '<div style="flex: 1;"></div>'}
                <button onclick="App.onboardingStep++; App.nextOnboardingStep();" style="flex: 1; padding: 10px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
                    ${isLastStep ? '完成' : '下一步'}
                </button>
            </div>
            <button onclick="App.endOnboardingFlow(); return false;" style="width: 100%; padding: 10px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.background='var(--bg-secondary)'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='transparent'; this.style.color='var(--text-secondary)';">
                结束引导，进入真实页面
            </button>
        `;
        document.body.appendChild(stepInfo);
        
        console.log('步骤信息已显示:', { currentStep, totalSteps, isLastStep, message: step.message });
    },
    
    /**
     * 结束引导流程，跳转到真实页面
     */
    async endOnboardingFlow() {
        // 保存当前步骤信息
        const currentStep = this.onboardingStep;
        const currentSteps = this.onboardingSteps;
        
        // 清理引导状态
        this.onboardingMode = false;
        this.onboardingStep = null;
        this.onboardingSteps = null;
        this.closeOnboarding();
        
        // 移除步骤信息卡片
        const stepInfo = document.querySelector('.onboarding-step-info');
        if (stepInfo) {
            stepInfo.remove();
        }
        
        // 跳转到当前步骤对应的真实页面
        if (currentStep !== null && currentSteps && currentStep < currentSteps.length) {
            const step = currentSteps[currentStep];
            await this.loadPage(step.page);
        } else {
            // 如果已完成或未定义，跳转到车源列表
            await this.loadPage('car-list');
        }
        
        Toast.success('🎉 引导完成！您现在可以开始实际操作了。');
    },
    
    /**
     * 上一步引导
     */
    async prevOnboardingStep() {
        if (this.onboardingStep > 0) {
            this.onboardingStep--;
            await this.nextOnboardingStep();
        }
    },
    
    /**
     * 获取Mock车源数据
     */
    getMockCarData() {
        return {
            brand: '奔驰',
            series: 'C200L',
            color: '白色',
            first_register_time: '2020-06-15',
            vin: 'WDDWF4KB0LR123456',
            plate_number: '京A12345',
            mileage: '35000',
            condition_description: '车况良好，无重大事故，定期保养',
            purchase_price: '280000',
            displacement: '2.0',
            transmission: '自动',
            fuel_type: '汽油',
            emission_standard: '国六',
            transfer_count: 0,
            insurance_expire_time: '2025-12-31',
            inspection_expire_time: '2025-06-30',
            accident_record: '无事故',
            maintenance_record: '定期保养，记录完整'
        };
    },
    
    /**
     * 渲染Mock门店列表
     */
    renderMockStoreList() {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = '门店管理';
        }
        return `
            <div class="card">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="card-title">门店列表</h3>
                    <button class="btn btn-primary" id="mock-create-store-btn">新增门店</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>门店编号</th>
                                <th>门店名称</th>
                                <th>联系电话</th>
                                <th>地址</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>ST001</td>
                                <td>北京朝阳店</td>
                                <td>010-12345678</td>
                                <td>北京市朝阳区xxx路xxx号</td>
                                <td><span class="badge badge-success">启用</span></td>
                                <td>
                                    <button class="btn btn-sm btn-secondary">详情</button>
                                </td>
                            </tr>
                            <tr>
                                <td>ST002</td>
                                <td>北京海淀店</td>
                                <td>010-87654321</td>
                                <td>北京市海淀区xxx路xxx号</td>
                                <td><span class="badge badge-success">启用</span></td>
                                <td>
                                    <button class="btn btn-sm btn-secondary">详情</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    
    /**
     * 渲染Mock车源表单
     */
    renderMockCarForm() {
        document.getElementById('page-title').textContent = '新增车源';
        const mockData = this.getMockCarData();
        return `
            <div class="card">
                <form id="car-form">
                    <div class="detail-section">
                        <h4 class="detail-section-title">基本信息</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>品牌 <span style="color: red;">*</span></label>
                                <input type="text" name="brand" value="${mockData.brand}" required>
                            </div>
                            <div class="form-group">
                                <label>车型/车系 <span style="color: red;">*</span></label>
                                <input type="text" name="series" value="${mockData.series}" required>
                            </div>
                            <div class="form-group">
                                <label>颜色 <span style="color: red;">*</span></label>
                                <input type="text" name="color" value="${mockData.color}" required>
                            </div>
                            <div class="form-group">
                                <label>首次上牌时间 <span style="color: red;">*</span></label>
                                <input type="date" name="first_register_time" value="${mockData.first_register_time}" required>
                            </div>
                            <div class="form-group">
                                <label>车架号(VIN) <span style="color: red;">*</span></label>
                                <input type="text" name="vin" value="${mockData.vin}" required>
                            </div>
                            <div class="form-group">
                                <label>车牌号 <span style="color: red;">*</span></label>
                                <input type="text" name="plate_number" value="${mockData.plate_number}" required>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4 class="detail-section-title">车况信息</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>公里数 <span style="color: red;">*</span></label>
                                <input type="number" name="mileage" value="${mockData.mileage}" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label>收车价（元） <span style="color: red;">*</span></label>
                                <input type="number" name="purchase_price" value="${mockData.purchase_price}" step="0.01" required>
                            </div>
                            <div class="form-group full-width">
                                <label>车况描述 <span style="color: red;">*</span></label>
                                <textarea name="condition_description" required>${mockData.condition_description}</textarea>
                            </div>
                        </div>
                    </div>
                    <div class="btn-group" style="margin-top: 24px;">
                        <button type="submit" class="btn btn-primary" id="mock-submit-btn">提交审核</button>
                        <button type="button" class="btn btn-secondary" onclick="App.loadPage('car-list')">取消</button>
                    </div>
                </form>
            </div>
        `;
    },
    
    /**
     * 渲染Mock待审核车源
     */
    renderMockCarAudit() {
        document.getElementById('page-title').textContent = '待审核车源';
        return `
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
                            <tr>
                                <td>京A12345</td>
                                <td>奔驰 C200L</td>
                                <td>¥280,000</td>
                                <td>${new Date().toLocaleString('zh-CN')}</td>
                                <td>
                                    <button class="btn btn-secondary">查看详情</button>
                                    <button class="btn btn-success">通过</button>
                                    <button class="btn btn-danger">驳回</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    
    /**
     * 渲染Mock车源列表
     */
    renderMockCarList(action) {
        document.getElementById('page-title').textContent = '车源管理';
        const mockCars = [
            {
                id: 1,
                plate_number: '京A12345',
                brand: '奔驰',
                series: 'C200L',
                store_name: '北京朝阳店',
                purchase_price: '280000',
                mileage: '35000',
                years: 4,
                car_status: action === 'reserve' ? '已预定' : action === 'sell' ? '已售出' : '待出售',
                stock_days: 15
            }
        ];
        
        let actionButtons = '';
        if (action === 'authorize') {
            actionButtons = '<button class="btn btn-sm btn-primary" onclick="App.showAuthorizeModal(1, 1)">授权</button>';
        } else if (action === 'reserve') {
            actionButtons = '<button class="btn btn-sm btn-outline" onclick="App.reserveCar(1)">预定</button>';
        } else if (action === 'sell') {
            actionButtons = '<button class="btn btn-sm btn-success" onclick="App.showSellModal(1, 1)">售卖</button>';
        } else {
            actionButtons = '<button class="btn btn-sm btn-secondary" onclick="App.showCarDetail(1)">详情</button>';
        }
        
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">车源列表</h3>
                    <button class="btn btn-primary">新增车源</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>车牌号</th>
                                <th>品牌/车型</th>
                                ${this.currentRole === 'headquarters_admin' ? '<th>收车门店</th>' : ''}
                                <th>收车价</th>
                                <th>公里数</th>
                                <th>年限</th>
                                <th>库存天数</th>
                                <th>车源状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${mockCars.map(car => `
                                <tr>
                                    <td>${car.plate_number}</td>
                                    <td>${car.brand} ${car.series}</td>
                                    ${this.currentRole === 'headquarters_admin' ? `<td>${car.store_name}</td>` : ''}
                                    <td style="color: var(--danger-color); font-weight: 600;">¥${parseFloat(car.purchase_price).toLocaleString()}</td>
                                    <td>${parseFloat(car.mileage).toLocaleString()}公里</td>
                                    <td>${car.years}年</td>
                                    <td>${car.stock_days}天</td>
                                    <td><span class="badge badge-info">${car.car_status}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-secondary" onclick="App.showCarDetail(${car.id})">详情</button>
                                        ${actionButtons}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    
    /**
     * 显示新手指引高亮
     */
    showOnboardingHighlight(pageName, action = null) {
        // 移除旧的遮罩（如果有）
        const oldOverlay = document.getElementById('onboarding-overlay');
        if (oldOverlay) {
            oldOverlay.remove();
        }
        
        // 创建遮罩层（更亮的遮罩，透明度降低）
        const overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.15);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // 根据页面类型和操作类型显示不同的指引
        let targetElement = null;
        let message = '';
        
        switch (pageName) {
            case 'store-list':
                if (action === 'create-store') {
                    // 查找新增门店按钮
                    targetElement = document.querySelector('.card-header .btn-primary') || 
                                   document.querySelector('.card-header button') ||
                                   document.querySelector('button.btn-primary');
                    message = '点击"新增门店"按钮可以创建新门店';
                }
                break;
            case 'car-create':
                if (action === 'create') {
                    // 填充mock数据
                    const form = document.querySelector('form#car-form');
                    if (form) {
                        const mockData = this.getMockCarData();
                        Object.keys(mockData).forEach(key => {
                            const input = form.querySelector(`[name="${key}"]`);
                            if (input && !input.value) {
                                input.value = mockData[key];
                            }
                        });
                    }
                    // 查找提交按钮，尝试多种选择器
                    targetElement = document.querySelector('#mock-submit-btn') ||
                                  document.querySelector('form#car-form button[type="submit"]') ||
                                  document.querySelector('form#car-form .btn-primary') ||
                                  document.querySelector('form#car-form button.btn-primary') ||
                                  document.querySelector('form button[type="submit"]') ||
                                  document.querySelector('.btn-group .btn-primary');
                    message = '填写完车辆信息后，点击"提交审核"按钮提交';
                }
                break;
            case 'car-audit':
                if (action === 'audit') {
                    // 如果有mock数据，先渲染
                    targetElement = document.querySelector('table tbody tr:first-child .btn-success');
                    if (!targetElement) {
                        targetElement = document.querySelector('table tbody tr:first-child button');
                    }
                    message = '点击"通过"按钮审核通过车源，车源状态将变为"待出售"';
                }
                break;
            case 'car-list':
                if (action === 'authorize') {
                    targetElement = document.querySelector('table tbody tr:first-child .btn-primary, table tbody tr:first-child button[onclick*="showAuthorizeModal"]');
                    message = '点击"授权"按钮，可以将车源授权给其他门店';
                } else if (action === 'reserve') {
                    targetElement = document.querySelector('table tbody tr:first-child button[onclick*="reserveCar"], table tbody tr:first-child .btn-outline');
                    message = '点击"预定"按钮可以预定车源，预定后只有预定方可以售卖';
                } else if (action === 'sell') {
                    targetElement = document.querySelector('table tbody tr:first-child button[onclick*="showSellModal"], table tbody tr:first-child .btn-success');
                    message = '点击"售卖"按钮可以完成售出登记，车源状态将变为"已售出"';
                } else {
                    targetElement = document.querySelector('table tbody tr:first-child button[onclick*="showCarDetail"]');
                    message = '点击"详情"按钮可以查看车源详细信息';
                }
                break;
        }
        
        // 先添加遮罩到页面
        document.body.appendChild(overlay);
        
        // 如果找不到目标元素，尝试多次查找
        if (!targetElement) {
            // 延迟查找，给页面更多渲染时间
            setTimeout(() => {
                switch (pageName) {
                    case 'store-list':
                        if (action === 'create-store') {
                            targetElement = document.querySelector('#mock-create-store-btn') ||
                                          document.querySelector('.card-header .btn-primary') ||
                                          document.querySelector('.card-header button') ||
                                          document.querySelector('button.btn-primary');
                        }
                        break;
                    case 'car-create':
                        if (action === 'create') {
                            targetElement = document.querySelector('#mock-submit-btn') ||
                                          document.querySelector('form#car-form button[type="submit"]') ||
                                          document.querySelector('form#car-form .btn-primary') ||
                                          document.querySelector('form#car-form button.btn-primary') ||
                                          document.querySelector('form button[type="submit"]') ||
                                          document.querySelector('.btn-group .btn-primary');
                        }
                        break;
                    case 'car-audit':
                        if (action === 'audit') {
                            targetElement = document.querySelector('table tbody tr:first-child .btn-success') ||
                                          document.querySelector('table tbody tr:first-child button');
                        }
                        break;
                    case 'car-list':
                        if (action === 'authorize') {
                            targetElement = document.querySelector('table tbody tr:first-child .btn-primary') ||
                                          document.querySelector('table tbody tr:first-child button[onclick*="showAuthorizeModal"]');
                        } else if (action === 'reserve') {
                            targetElement = document.querySelector('table tbody tr:first-child button[onclick*="reserveCar"]') ||
                                          document.querySelector('table tbody tr:first-child .btn-outline');
                        } else if (action === 'sell') {
                            targetElement = document.querySelector('table tbody tr:first-child button[onclick*="showSellModal"]') ||
                                          document.querySelector('table tbody tr:first-child .btn-success');
                        }
                        break;
                }
                
                if (targetElement) {
                    // 清空overlay内容，重新添加高亮
                    overlay.innerHTML = '';
                    overlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.15);
                        z-index: 9999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    `;
                    this.highlightElement(targetElement, message, overlay);
                } else {
                    // 如果还是找不到，显示通用提示
                    this.showGenericTooltip(overlay, message);
                }
            }, 1000);
        } else {
            this.highlightElement(targetElement, message, overlay);
        }
        
        // 添加脉冲动画
        if (!document.getElementById('onboarding-style')) {
            const style = document.createElement('style');
            style.id = 'onboarding-style';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    /**
     * 高亮元素
     */
    highlightElement(targetElement, message, overlay) {
        const rect = targetElement.getBoundingClientRect();
        const highlight = document.createElement('div');
        highlight.style.cssText = `
            position: fixed;
            top: ${rect.top}px;
            left: ${rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border: 3px solid var(--primary-color);
            border-radius: 8px;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.15), 0 0 20px rgba(59, 130, 246, 0.5);
            z-index: 10000;
            pointer-events: none;
            animation: pulse 2s infinite;
        `;
        
        // 添加提示框
        const tooltip = document.createElement('div');
        tooltip.className = 'onboarding-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            top: ${rect.bottom + 20}px;
            left: ${Math.max(20, rect.left)}px;
            background: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            max-width: 300px;
            font-size: 14px;
            line-height: 1.6;
            color: var(--text-primary);
        `;
        tooltip.innerHTML = `
            <div style="margin-bottom: 12px; font-weight: 600; color: var(--primary-color);">💡 操作提示</div>
            <div>${message}</div>
        `;
        
        overlay.appendChild(highlight);
        overlay.appendChild(tooltip);
        overlay.onclick = (e) => {
            if (e.target === overlay && !this.onboardingStep) {
                this.closeOnboarding();
            }
        };
    },
    
    /**
     * 显示通用提示
     */
    showGenericTooltip(overlay, message) {
        overlay.innerHTML = '';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.15);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        overlay.innerHTML = `
            <div style="background: white; padding: 24px; border-radius: 8px; max-width: 400px; text-align: center;">
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: var(--primary-color);">📖 新手指引</div>
                <div style="margin-bottom: 20px; line-height: 1.6; color: var(--text-primary);">${message || '请查看页面中的相关功能按钮和操作区域'}</div>
                <button onclick="App.closeOnboarding()" style="padding: 10px 24px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">我知道了</button>
            </div>
        `;
    },
    
    /**
     * 关闭新手指引
     */
    closeOnboarding() {
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.remove();
        }
        this.onboardingStep = null;
        this.onboardingSteps = null;
    },
    
    /** 计算库存天数（购买至今或售出时间） */
    calcStockDays(purchaseTs, soldTs) {
        if (!purchaseTs) return '-';
        const start = parseInt(purchaseTs, 10) || 0;
        const end = (soldTs && parseInt(soldTs, 10) > 0) ? parseInt(soldTs, 10) : Math.floor(Date.now() / 1000);
        const days = Math.ceil((end - start) / 86400);
        return days >= 0 ? `${days}天` : '-';
    },

    /**
     * 渲染骨架屏（根据页面类型显示不同骨架）
     */
    renderSkeleton(pageName) {
        const tableSkeleton = `
            <div class="card">
                <div class="card-header">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-btn"></div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                ${Array.from({ length: 6 }).map(() => '<th><div class="skeleton skeleton-th"></div></th>').join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${Array.from({ length: 6 }).map(() => `
                                <tr>
                                    ${Array.from({ length: 6 }).map(() => '<td><div class="skeleton skeleton-td"></div></td>').join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        
        const formSkeleton = `
            <div class="card">
                <div class="card-header">
                    <div class="skeleton skeleton-title"></div>
                </div>
                <div class="form-grid">
                    ${Array.from({ length: 6 }).map(() => `
                        <div class="form-group">
                            <div class="skeleton skeleton-label"></div>
                            <div class="skeleton skeleton-input"></div>
                        </div>
                    `).join('')}
                    <div class="form-group full-width">
                        <div class="skeleton skeleton-label"></div>
                        <div class="skeleton skeleton-textarea"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="skeleton skeleton-btn"></div>
                    <div class="skeleton skeleton-btn"></div>
                </div>
            </div>`;
        
        switch (pageName) {
            case 'car-create':
                return formSkeleton;
            case 'store-list':
            case 'car-list':
            case 'car-audit':
            default:
                return tableSkeleton;
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
        
        // 初始化排序状态（如果未设置）
        if (this.carListSortField === undefined) {
            this.carListSortField = '';
            this.carListSortOrder = '';
        }
        
        // 在重新渲染前，保存当前筛选条件的值（如果元素存在）
        const savedFilterType = document.getElementById('car-filter-type')?.value;
        const savedKeyword = document.getElementById('car-keyword')?.value || '';
        const savedBrand = document.getElementById('car-brand')?.value || '';
        // 读取多选状态（默认仅勾选待出售）
        const statusAllChecked = document.getElementById('status-all')?.checked;
        const statusSaleChecked = document.getElementById('status-sale')?.checked;
        const statusReservedChecked = document.getElementById('status-reserved')?.checked;
        const statusSoldChecked = document.getElementById('status-sold')?.checked;
        const savedStoreId = document.getElementById('car-store-id')?.value || '';
        
        // 获取筛选条件（优先使用保存的值，否则使用默认值）
        const filterType = savedFilterType || (this.currentRole === 'store_admin' ? 'all' : 'store');
        const keyword = savedKeyword;
        const brand = savedBrand;
        // 组装 car_statuses（若全选则为空代表全部；若都未选则默认待出售）
        let carStatuses = [];
        if (statusAllChecked) {
            carStatuses = [];
        } else {
            if (statusSaleChecked) carStatuses.push('待出售');
            if (statusReservedChecked) carStatuses.push('已预定');
            if (statusSoldChecked) carStatuses.push('已售出');
            if (carStatuses.length === 0) {
                carStatuses = ['待出售'];
            }
        }
        
        // 审核状态移除：采用新四态，不再使用审核筛选
        
        const storeId = savedStoreId;
        
        // 获取排序参数
        const sortField = this.carListSortField || '';
        const sortOrder = this.carListSortOrder || '';
        
        const params = {
            page: page,
            limit: 15,
            filter_type: filterType,
            keyword: keyword,
            brand: brand,
            car_statuses: carStatuses,
            store_id: storeId,
            sort_field: sortField,
            sort_order: sortOrder
        };
        
        const result = await Car.getList(params);
        const cars = result.data.list || [];
        const pagination = result.data.pagination || {};
        const total = pagination.total ?? result.data.total ?? cars.length;
        const limit = pagination.limit ?? params.limit ?? 15;
        const currentPage = pagination.page ?? page;
        const totalPages = pagination.pages ?? Math.max(1, Math.ceil(total / limit));
        
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
                        <div id="car-status-group" class="checkbox-group">
                            <label class="checkbox-inline">
                                <input type="checkbox" id="status-all" onchange="(function(){ const on=this.checked; document.querySelectorAll('#car-status-group input[type=checkbox]').forEach(cb=>{ if(cb.id!=='status-all') cb.checked=false; }); if(!on){ document.getElementById('status-sale').checked=true; } App.renderCarList(1); }).call(this)"> 全部
                            </label>
                            <label class="checkbox-inline">
                                <input type="checkbox" id="status-sale" onchange="document.getElementById('status-all').checked=false; App.renderCarList(1)"> 待出售
                            </label>
                            <label class="checkbox-inline">
                                <input type="checkbox" id="status-reserved" onchange="document.getElementById('status-all').checked=false; App.renderCarList(1)"> 已预定
                            </label>
                            <label class="checkbox-inline">
                                <input type="checkbox" id="status-sold" onchange="document.getElementById('status-all').checked=false; App.renderCarList(1)"> 已售出
                            </label>
                        </div>
                    </div>
                    <div class="filter-item filter-search">
                        <button class="btn btn-primary" onclick="App.renderCarList(1)">
                            <i class="fas fa-search"></i> 搜索
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                ${this.renderSortableHeader('plate_number', '车牌号', 100)}
                                ${this.renderSortableHeader('brand', '品牌/车型', 150)}
                                ${this.currentRole === 'headquarters_admin' ? this.renderSortableHeader('store_name', '收车门店', 120) : ''}
                                ${this.renderSortableHeader('purchase_price', '收车价', 100)}
                                ${this.renderSortableHeader('mileage', '公里数', 80)}
                                ${this.renderSortableHeader('years', '年限', 80)}
                                ${this.renderSortableHeader('purchase_time', '库存天数', 100)}
                                ${this.renderSortableHeader('car_status', '车源状态', 100)}
                                ${this.currentRole === 'store_admin' ? '<th style="min-width: 80px;">来源</th>' : ''}
                                <th style="min-width: 150px;">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cars.length === 0 ? `
                                <tr>
                                    <td colspan="${this.currentRole === 'headquarters_admin' ? '11' : this.currentRole === 'store_admin' ? '10' : '8'}" style="text-align: center; padding: 40px;">
                                        <div class="empty-state">
                                            <i class="fas fa-car"></i>
                                            <p>暂无车源数据</p>
                                        </div>
                                    </td>
                                </tr>
                            ` :
                            cars.map(car => {
                                const isOwner = parseInt(car.store_id) === parseInt(this.currentUser?.store_id || -1);
                                const isAuthorized = car.is_authorized || false;
                                const canSee = (this.currentRole === 'headquarters_admin') || isOwner || isAuthorized;
                                
                                // 待出售：本店收车和被授权车源都能预定和出售
                                const canReserve = canSee && car.car_status === '待出售';
                                const canSellWhenAvailable = canSee && car.car_status === '待出售';
                                
                                // 已预定：本店预定的可以出售，非本店预定不可出售
                                const isReservedByMe = car.car_status === '已预定' && parseInt(car.reserved_store_id || -1) === parseInt(this.currentUser?.store_id || -2);
                                const canSellWhenReserved = isReservedByMe;
                                const canUnreserve = isReservedByMe;
                                
                                // 授权：仅本店收车可授权，他店授权过来的无授权功能，待上架状态不可授权
                                const canAuthorize = (this.currentRole === 'headquarters_admin' || isOwner) && !isAuthorized && car.car_status !== '已售出' && car.car_status !== '待上架';
                                
                                return `
                                <tr>
                                    <div style="display:none"></div>
                                    <td class="text-nowrap">${car.plate_number || '-'}</td>
                                    <td class="text-nowrap">${(car.brand || '') + ' ' + (car.series || '')}</td>
                                    ${this.currentRole === 'headquarters_admin' ? `<td class="text-nowrap">${(parseInt(car.store_id) === 0 ? '总部' : (car.store_name || '-'))}</td>` : ''}
                                    <td class="text-nowrap" style="color: var(--danger-color); font-weight: 600;">¥${car.purchase_price ? parseFloat(car.purchase_price).toLocaleString() : '0'}</td>
                                    <td class="text-nowrap">${car.mileage ? parseFloat(car.mileage).toLocaleString() + '公里' : '-'}</td>
                                    <td class="text-nowrap">${car.years || 0}年</td>
                                    <td class="text-nowrap">${this.calcStockDays(car.purchase_time, car.sold_time)}</td>
                                    <td class="text-nowrap"><span class="badge badge-info">${car.car_status || '-'}</span></td>
                                    ${this.currentRole === 'store_admin' ? `<td class="text-nowrap">${isAuthorized ? '<span class="badge badge-warning">他店</span>' : '<span class="badge badge-info">本店</span>'}</td>` : ''}
                                    <td class="text-nowrap">
                                        <button class="btn btn-xs btn-secondary" onclick="App.showCarDetail(${car.id})">详情</button>
                                        ${this.currentRole === 'store_input' && car.car_status === '待上架' ? `
                                            <button class="btn btn-xs btn-warning" onclick="App.showEditCarForm(${car.id})">编辑</button>
                                        ` : ''}
                                        ${this.currentRole === 'headquarters_admin' && canSee && car.car_status !== '已售出' ? `
                                            ${canAuthorize ? `<button class="btn btn-xs btn-primary" onclick="App.showAuthorizeModal(${car.id}, ${car.store_id})">授权</button>` : ''}
                                            ${car.car_status === '待上架' ? `<button class="btn btn-xs btn-warning" onclick="App.publishCar(${car.id})">上架</button>` : ''}
                                            ${canReserve ? `<button class="btn btn-xs btn-outline" onclick="App.reserveCar(${car.id})">预定</button>` : ''}
                                            ${canSellWhenAvailable ? `<button class="btn btn-xs btn-success" onclick="App.showSellModal(${car.id}, ${car.store_id || 0})">售卖</button>` : ''}
                                            ${canSellWhenReserved ? `<button class="btn btn-xs btn-success" onclick="App.showSellModal(${car.id}, ${car.store_id || 0})">售卖</button>` : ''}
                                        ` : ''}
                                        ${this.currentRole === 'store_admin' && canSee && car.car_status !== '已售出' ? `
                                            ${car.car_status === '待上架' && isOwner ? `<button class="btn btn-xs btn-warning" onclick="App.publishCar(${car.id})">上架</button>` : ''}
                                            ${canReserve ? `<button class="btn btn-xs btn-outline" onclick="App.reserveCar(${car.id})">预定</button>` : ''}
                                            ${canSellWhenAvailable ? `<button class="btn btn-xs btn-success" onclick="App.showSellModal(${car.id}, ${this.currentUser?.store_id || 0})">售卖</button>` : ''}
                                            ${canUnreserve ? `<button class="btn btn-xs btn-secondary" onclick="App.unreserveCar(${car.id})">取消预定</button>` : ''}
                                            ${canSellWhenReserved ? `<button class="btn btn-xs btn-success" onclick="App.showSellModal(${car.id}, ${this.currentUser?.store_id || 0})">售卖</button>` : ''}
                                            ${car.car_status === '已预定' && !isReservedByMe ? `<span class="badge badge-warning">已被他店预定</span>` : ''}
                                        ` : ''}
                                    </td>
                                </tr>`;}).join('')}
                        </tbody>
                    </table>
                </div>
                
                <!-- 分页组件 -->
                ${totalPages > 1 ? `
                    <div class="pagination" style="display: flex; align-items: center; justify-content: center; gap: 16px; padding: 20px 0;">
                        <button class="btn btn-sm ${currentPage <= 1 ? 'btn-disabled' : 'btn-secondary'}" 
                                onclick="${currentPage > 1 ? `App.renderCarList(${currentPage - 1})` : ''}" 
                                ${currentPage <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left"></i> 上一页
                        </button>
                        <span class="pagination-info" style="font-size: 14px; color: var(--text-primary);">
                            第 <strong>${currentPage}</strong> / <strong>${totalPages}</strong> 页，共 <strong>${total}</strong> 条
                        </span>
                        <button class="btn btn-sm ${currentPage >= totalPages ? 'btn-disabled' : 'btn-secondary'}" 
                                onclick="${currentPage < totalPages ? `App.renderCarList(${currentPage + 1})` : ''}" 
                                ${currentPage >= totalPages ? 'disabled' : ''}>
                            下一页 <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                ` : total > 0 ? `
                    <div class="pagination" style="display: flex; align-items: center; justify-content: center; padding: 20px 0;">
                        <span class="pagination-info" style="font-size: 14px; color: var(--text-primary);">共 <strong>${total}</strong> 条数据</span>
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
        // 设置状态多选框默认：仅勾选待出售（若用户无选择）
        const g = document.getElementById('car-status-group');
        if (g) {
            const all = document.getElementById('status-all');
            const sale = document.getElementById('status-sale');
            const reserved = document.getElementById('status-reserved');
            const sold = document.getElementById('status-sold');
            // 先清空
            if (all) all.checked = false;
            if (sale) sale.checked = false;
            if (reserved) reserved.checked = false;
            if (sold) sold.checked = false;
            // 根据当前 carStatuses 回填
            const cur = (carStatuses || []);
            if (cur.length === 0) {
                // 全部
                if (all) all.checked = true;
            } else {
                if (cur.includes('待出售') && sale) sale.checked = true;
                if (cur.includes('已预定') && reserved) reserved.checked = true;
                if (cur.includes('已售出') && sold) sold.checked = true;
                // 如果都未选中，按默认仅待出售
                if (!sale.checked && !reserved.checked && !sold.checked) {
                    sale.checked = true;
                }
            }
        }
        // 移除审核筛选的值设置逻辑
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
     * 渲染可排序的表头
     */
    renderSortableHeader(field, label, minWidth) {
        const currentField = this.carListSortField || '';
        const currentOrder = this.carListSortOrder || '';
        const isActive = currentField === field;
        const isAsc = isActive && currentOrder === 'asc';
        const isDesc = isActive && currentOrder === 'desc';
        
        let icon = '';
        if (isAsc) {
            icon = '<i class="fas fa-sort-up" style="margin-left: 4px; color: var(--primary-color);"></i>';
        } else if (isDesc) {
            icon = '<i class="fas fa-sort-down" style="margin-left: 4px; color: var(--primary-color);"></i>';
        } else {
            icon = '<i class="fas fa-sort" style="margin-left: 4px; color: var(--text-secondary); opacity: 0.5;"></i>';
        }
        
        return `
            <th style="min-width: ${minWidth}px; cursor: pointer; user-select: none;" 
                onclick="App.handleSort('${field}')"
                onmouseover="this.style.backgroundColor='var(--bg-secondary)'"
                onmouseout="this.style.backgroundColor=''">
                ${label}${icon}
            </th>
        `;
    },
    
    /**
     * 处理排序
     */
    handleSort(field) {
        const currentField = this.carListSortField || '';
        const currentOrder = this.carListSortOrder || '';
        
        if (currentField === field) {
            // 如果点击的是当前排序字段，切换排序顺序
            if (currentOrder === 'asc') {
                this.carListSortField = field;
                this.carListSortOrder = 'desc';
            } else if (currentOrder === 'desc') {
                // 取消排序
                this.carListSortField = '';
                this.carListSortOrder = '';
            } else {
                // 默认升序
                this.carListSortField = field;
                this.carListSortOrder = 'asc';
            }
        } else {
            // 新字段，默认升序
            this.carListSortField = field;
            this.carListSortOrder = 'asc';
        }
        
        // 重新渲染列表（回到第一页）
        this.renderCarList(1);
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
                    <!-- 基本信息 -->
                    <div class="detail-section">
                        <h4 class="detail-section-title">基本信息</h4>
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
                                <label>颜色 <span style="color: red;">*</span></label>
                                <input type="text" name="color" value="${car ? car.color : ''}" required>
                            </div>
                            <div class="form-group">
                                <label>首次上牌时间 <span style="color: red;">*</span></label>
                                <input type="date" name="first_register_time" value="${car ? car.first_register_time : ''}" required>
                            </div>
                            <div class="form-group">
                                <label>车架号(VIN) <span style="color: red;">*</span></label>
                                <input type="text" name="vin" value="${car ? car.vin : ''}" required>
                            </div>
                            <div class="form-group">
                                <label>车牌号 <span style="color: red;">*</span></label>
                                <input type="text" name="plate_number" value="${car ? car.plate_number : ''}" required>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 车辆参数 -->
                    <div class="detail-section">
                        <h4 class="detail-section-title">车辆参数</h4>
                        <div class="form-grid">
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
                        </div>
                    </div>
                    
                    <!-- 车况信息 -->
                    <div class="detail-section">
                        <h4 class="detail-section-title">车况信息</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>公里数 <span style="color: red;">*</span></label>
                                <input type="number" name="mileage" value="${car ? car.mileage : ''}" step="0.01" required>
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
                        </div>
                    </div>
                    
                    <!-- 收车信息 -->
                    <div class="detail-section">
                        <h4 class="detail-section-title">收车信息</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>收车价（元） <span style="color: red;">*</span></label>
                                <input type="number" name="purchase_price" value="${car ? car.purchase_price : ''}" step="0.01" required>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 照片 -->
                    <div class="detail-section">
                        <h4 class="detail-section-title">车辆照片</h4>
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
        try {
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
                        ${car.car_status === '已预定' ? `
                            <div class="detail-item">
                                <span class="detail-label">预定门店：</span>
                                <span class="detail-value">${parseInt(car.reserved_store_id||0)===0 ? '总部' : (car.reserved_store_name || car.reserved_store_id || '-')}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">预定时间：</span>
                                <span class="detail-value">${car.reserved_time ? new Date(car.reserved_time * 1000).toLocaleString('zh-CN') : '-'}</span>
                            </div>
                        ` : ``}
                        ${car.car_status === '已售出' ? `
                            <div class="detail-item">
                                <span class="detail-label">售出门店：</span>
                                <span class="detail-value">${parseInt(car.sold_store_id||0)===0 ? '总部' : (car.sold_store_name || car.sold_store_id || '-')}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">售出时间：</span>
                                <span class="detail-value">${car.sold_time ? new Date(car.sold_time * 1000).toLocaleString('zh-CN') : '-'}</span>
                            </div>
                        ` : ``}
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
                
                <div class="detail-section">
                    <div class="detail-text">库存天数：<strong>${this.calcStockDays(car.purchase_time, car.sold_time)}</strong></div>
                </div>
                
                ${(() => {
                    const isOwner = parseInt(car.store_id) === parseInt(this.currentUser?.store_id || -1);
                    const isAuthorized = car.is_authorized || false;
                    const canSee = (this.currentRole === 'headquarters_admin') || isOwner || isAuthorized;
                    
                    // 待出售：本店收车和被授权车源都能预定和出售
                    const canReserve = canSee && car.car_status === '待出售';
                    const canSellWhenAvailable = canSee && car.car_status === '待出售';
                    
                    // 已预定：本店预定的可以出售，非本店预定不可出售
                    const isReservedByMe = car.car_status === '已预定' && parseInt(car.reserved_store_id || -1) === parseInt(this.currentUser?.store_id || -2);
                    const canSellWhenReserved = isReservedByMe;
                    const canUnreserve = isReservedByMe;
                    
                    // 授权：仅本店收车可授权，他店授权过来的无授权功能，待上架状态不可授权
                    const canAuthorize = (this.currentRole === 'headquarters_admin' || isOwner) && !isAuthorized && car.car_status !== '已售出' && car.car_status !== '待上架';
                    
                    if (!canSee || car.car_status === '已售出') return '';
                    
                    if (this.currentRole === 'headquarters_admin') {
                        return `
                            <div class="detail-section" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                                ${canAuthorize ? `<button class="btn btn-primary" onclick="App.showAuthorizeModal(${car.id}, ${car.store_id})">授权</button>` : ''}
                                ${car.car_status === '待上架' ? `<button class="btn btn-warning" style="margin-left: 8px;" onclick="App.publishCar(${car.id})">上架</button>` : ''}
                                ${canReserve ? `<button class="btn btn-outline" style="margin-left: 8px;" onclick="App.reserveCar(${car.id})">预定</button>` : ''}
                                ${canSellWhenAvailable ? `<button class="btn btn-success" style="margin-left: 8px;" onclick="App.showSellModal(${car.id}, ${car.store_id || 0})">售卖</button>` : ''}
                                ${canSellWhenReserved ? `<button class="btn btn-success" style="margin-left: 8px;" onclick="App.showSellModal(${car.id}, ${car.store_id || 0})">售卖</button>` : ''}
                            </div>
                        `;
                    } else if (this.currentRole === 'store_admin') {
                        return `
                            <div class="detail-section" style="margin-top: 12px;">
                                ${car.car_status === '待上架' && isOwner ? `<button class="btn btn-warning" onclick="App.publishCar(${car.id})">上架</button>` : ''}
                                ${canReserve ? `<button class="btn btn-outline" style="margin-left: 8px;" onclick="App.reserveCar(${car.id})">预定</button>` : ''}
                                ${canSellWhenAvailable ? `<button class="btn btn-success" style="margin-left: 8px;" onclick="App.showSellModal(${car.id}, ${this.currentUser?.store_id || 0})">售卖</button>` : ''}
                                ${canUnreserve ? `<button class="btn btn-secondary" style="margin-left: 8px;" onclick="App.unreserveCar(${car.id})">取消预定</button>` : ''}
                                ${canSellWhenReserved ? `<button class="btn btn-success" style="margin-left: 8px;" onclick="App.showSellModal(${car.id}, ${this.currentUser?.store_id || 0})">售卖</button>` : ''}
                                ${car.car_status === '已预定' && !isReservedByMe ? `<span class="badge badge-warning" style="margin-left: 8px;">已被他店预定</span>` : ''}
                            </div>
                        `;
                    }
                    return '';
                })()}
            </div>
        `);
        } catch (error) {
            console.error('showCarDetail error:', error);
            Toast.error(error?.message || '加载详情失败');
        }
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