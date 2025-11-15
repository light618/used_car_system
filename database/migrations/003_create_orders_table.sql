-- 订单表
CREATE TABLE IF NOT EXISTS `uc_orders` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` varchar(50) NOT NULL DEFAULT '' COMMENT '订单号',
  `user_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '用户ID',
  `car_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '车辆ID',
  `type` tinyint(1) NOT NULL DEFAULT '1' COMMENT '订单类型 1预约看车 2购买订单',
  `appointment_time` int(11) NOT NULL DEFAULT '0' COMMENT '预约时间',
  `appointment_address` varchar(255) NOT NULL DEFAULT '' COMMENT '预约地址',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '订单金额',
  `pay_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '实付金额',
  `pay_type` varchar(20) NOT NULL DEFAULT '' COMMENT '支付方式',
  `pay_time` int(11) NOT NULL DEFAULT '0' COMMENT '支付时间',
  `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '订单状态 0待支付 1已支付 2已完成 3已取消',
  `remark` varchar(500) NOT NULL DEFAULT '' COMMENT '备注',
  `create_time` int(11) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(11) NOT NULL DEFAULT '0' COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `user_id` (`user_id`),
  KEY `car_id` (`car_id`),
  KEY `status` (`status`),
  KEY `create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

