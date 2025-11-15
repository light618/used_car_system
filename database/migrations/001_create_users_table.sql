-- 用户表
CREATE TABLE IF NOT EXISTS `uc_users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `openid` varchar(100) NOT NULL DEFAULT '' COMMENT '微信openid',
  `unionid` varchar(100) NOT NULL DEFAULT '' COMMENT '微信unionid',
  `nickname` varchar(50) NOT NULL DEFAULT '' COMMENT '昵称',
  `avatar` varchar(255) NOT NULL DEFAULT '' COMMENT '头像',
  `phone` varchar(20) NOT NULL DEFAULT '' COMMENT '手机号',
  `gender` tinyint(1) NOT NULL DEFAULT '0' COMMENT '性别 0未知 1男 2女',
  `is_vip` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否VIP 0否 1是',
  `vip_expire_time` int(11) NOT NULL DEFAULT '0' COMMENT 'VIP过期时间',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态 0禁用 1启用',
  `create_time` int(11) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(11) NOT NULL DEFAULT '0' COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `openid` (`openid`),
  KEY `phone` (`phone`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

