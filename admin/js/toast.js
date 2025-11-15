/**
 * 提示框工具类
 */
const Toast = {
    /**
     * 显示提示消息
     * @param {string} message 提示消息
     * @param {string} type 类型：success, error, warning, info
     * @param {number} duration 显示时长（毫秒），默认3000
     */
    show(message, type = 'info', duration = 3000) {
        // 移除旧的提示
        const oldToast = document.querySelector('.toast-container');
        if (oldToast) {
            oldToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'toast-container';
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast toast-${type}">
                <i class="fas ${icons[type] || icons.info}"></i>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // 触发动画
        setTimeout(() => {
            toast.querySelector('.toast').classList.add('show');
        }, 10);
        
        // 自动移除
        if (duration > 0) {
            setTimeout(() => {
                toast.querySelector('.toast').classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, duration);
        }
        
        return toast;
    },
    
    /**
     * 成功提示
     */
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    },
    
    /**
     * 错误提示
     */
    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    },
    
    /**
     * 警告提示
     */
    warning(message, duration = 3000) {
        return this.show(message, 'warning', duration);
    },
    
    /**
     * 信息提示
     */
    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    },
    
    /**
     * 确认对话框
     * @param {string} message 提示消息
     * @param {string} title 标题
     * @returns {Promise<boolean>} 用户选择结果
     */
    confirm(message, title = '确认操作') {
        return new Promise((resolve) => {
            // 移除旧的确认框
            const oldConfirm = document.querySelector('.confirm-overlay');
            if (oldConfirm) {
                oldConfirm.remove();
            }
            
            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            
            overlay.innerHTML = `
                <div class="confirm-dialog">
                    <div class="confirm-header">
                        <h4 class="confirm-title">
                            <i class="fas fa-question-circle"></i> ${title}
                        </h4>
                    </div>
                    <div class="confirm-body">
                        <p class="confirm-message">${message}</p>
                    </div>
                    <div class="confirm-footer">
                        <button class="btn btn-secondary" id="confirm-cancel">取消</button>
                        <button class="btn btn-primary" id="confirm-ok">确定</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // 触发显示动画
            setTimeout(() => {
                overlay.classList.add('show');
            }, 10);
            
            // 绑定事件
            const okBtn = overlay.querySelector('#confirm-ok');
            const cancelBtn = overlay.querySelector('#confirm-cancel');
            
            const close = (result) => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    overlay.remove();
                }, 300);
                resolve(result);
            };
            
            okBtn.onclick = () => close(true);
            cancelBtn.onclick = () => close(false);
            
            // 点击遮罩层关闭（默认取消）
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    close(false);
                }
            };
            
            // ESC键关闭
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    close(false);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        });
    }
};

