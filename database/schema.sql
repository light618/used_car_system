-- 集团二手车管理系统 - 数据库表结构
-- 主公，这是完整的数据库表结构

-- 1. 门店表
CREATE TABLE IF NOT EXISTS `uc_stores` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '门店ID',
  `store_code` varchar(50) NOT NULL DEFAULT '' COMMENT '门店编码（唯一）',
  `store_name` varchar(100) NOT NULL DEFAULT '' COMMENT '门店名称',
  `store_address` varchar(255) NOT NULL DEFAULT '' COMMENT '门店位置（详细地址）',
  `store_phone` varchar(20) NOT NULL DEFAULT '' COMMENT '门店联系电话',
  `store_description` text COMMENT '门店描述',
  `remark` varchar(500) NOT NULL DEFAULT '' COMMENT '备注',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态 0禁用 1启用',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否删除 0否 1是',
  `create_time` int(11) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(11) NOT NULL DEFAULT '0' COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_code` (`store_code`),
  KEY `status` (`status`),
  KEY `is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='门店表';

-- 2. 用户表
CREATE TABLE IF NOT EXISTS `uc_users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL DEFAULT '' COMMENT '用户名（账号）',
  `password` varchar(255) NOT NULL DEFAULT '' COMMENT '密码（加密）',
  `real_name` varchar(50) NOT NULL DEFAULT '' COMMENT '真实姓名',
  `role` varchar(20) NOT NULL DEFAULT '' COMMENT '角色：headquarters_admin/store_admin/store_input',
  `store_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '所属门店ID（总部为0）',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态 0禁用 1启用',
  `last_login_time` int(11) NOT NULL DEFAULT '0' COMMENT '最后登录时间',
  `create_time` int(11) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(11) NOT NULL DEFAULT '0' COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `role` (`role`),
  KEY `store_id` (`store_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 3. 车源表
CREATE TABLE IF NOT EXISTS `uc_cars` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '车源ID',
  `store_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '收车门店ID',
  `input_user_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '录入人员ID',
  `brand` varchar(50) NOT NULL DEFAULT '' COMMENT '品牌',
  `series` varchar(50) NOT NULL DEFAULT '' COMMENT '车型/车系',
  `model` varchar(50) NOT NULL DEFAULT '' COMMENT '车辆型号',
  `color` varchar(20) NOT NULL DEFAULT '' COMMENT '颜色',
  `first_register_time` date NOT NULL COMMENT '首次上牌时间',
  `years` int(4) NOT NULL DEFAULT '0' COMMENT '年限（自动计算）',
  `vin` varchar(50) NOT NULL DEFAULT '' COMMENT '车架号（唯一）',
  `plate_number` varchar(20) NOT NULL DEFAULT '' COMMENT '车牌号',
  `mileage` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '公里数',
  `condition_description` text COMMENT '车况描述',
  `purchase_price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '收车价（元）',
  `purchase_time` int(11) NOT NULL DEFAULT '0' COMMENT '收车时间',
  `car_status` varchar(20) NOT NULL DEFAULT '收钥匙' COMMENT '车源状态：收钥匙/已过户/已订/已售出',
  `audit_status` varchar(20) NOT NULL DEFAULT '待审核' COMMENT '审核状态：待审核/审核通过/审核驳回',
  `audit_user_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '审核人员ID',
  `audit_time` int(11) NOT NULL DEFAULT '0' COMMENT '审核时间',
  `audit_remark` varchar(500) NOT NULL DEFAULT '' COMMENT '审核意见',
  `submit_headquarters_time` int(11) NOT NULL DEFAULT '0' COMMENT '提交总部时间',
  `displacement` varchar(20) NOT NULL DEFAULT '' COMMENT '排量（L）',
  `transmission` varchar(20) NOT NULL DEFAULT '' COMMENT '变速箱类型',
  `fuel_type` varchar(20) NOT NULL DEFAULT '' COMMENT '燃料类型',
  `emission_standard` varchar(20) NOT NULL DEFAULT '' COMMENT '排放标准',
  `transfer_count` int(11) NOT NULL DEFAULT '0' COMMENT '过户次数',
  `insurance_expire_time` date DEFAULT NULL COMMENT '保险到期时间',
  `inspection_expire_time` date DEFAULT NULL COMMENT '年检到期时间',
  `car_config` varchar(500) NOT NULL DEFAULT '' COMMENT '车辆配置（JSON）',
  `accident_record` varchar(50) NOT NULL DEFAULT '' COMMENT '事故记录',
  `maintenance_record` text COMMENT '维修记录',
  `remark` varchar(500) NOT NULL DEFAULT '' COMMENT '备注',
  `create_time` int(11) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(11) NOT NULL DEFAULT '0' COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `vin` (`vin`),
  KEY `store_id` (`store_id`),
  KEY `input_user_id` (`input_user_id`),
  KEY `audit_status` (`audit_status`),
  KEY `car_status` (`car_status`),
  KEY `create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车源表';

-- 4. 车源图片表
CREATE TABLE IF NOT EXISTS `uc_car_images` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `car_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '车源ID',
  `image_type` varchar(20) NOT NULL DEFAULT 'car' COMMENT '图片类型：car车辆照片/green_book绿本照片',
  `image_url` varchar(255) NOT NULL DEFAULT '' COMMENT '图片URL',
  `sort_order` int(11) NOT NULL DEFAULT '0' COMMENT '排序',
  `create_time` int(11) NOT NULL DEFAULT '0' COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `car_id` (`car_id`),
  KEY `image_type` (`image_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车源图片表';

-- 5. 车源授权表
CREATE TABLE IF NOT EXISTS `uc_car_authorizations` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `car_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '车源ID',
  `authorized_store_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '被授权门店ID',
  `authorize_user_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '授权人员ID（总部管理员）',
  `authorize_time` int(11) NOT NULL DEFAULT '0' COMMENT '授权时间',
  `is_revoked` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已收回 0否 1是',
  `revoke_time` int(11) NOT NULL DEFAULT '0' COMMENT '收回时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `car_store` (`car_id`,`authorized_store_id`),
  KEY `car_id` (`car_id`),
  KEY `authorized_store_id` (`authorized_store_id`),
  KEY `is_revoked` (`is_revoked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车源授权表';

-- 插入默认总部管理员账号（密码：admin123，实际使用时需要加密）
-- 实际密码应该是：password_hash('admin123', PASSWORD_DEFAULT)
INSERT INTO `uc_users` (`username`, `password`, `real_name`, `role`, `store_id`, `status`, `create_time`, `update_time`) 
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'headquarters_admin', 0, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

