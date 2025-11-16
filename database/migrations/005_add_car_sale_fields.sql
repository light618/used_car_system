ALTER TABLE `uc_cars`
ADD COLUMN `sold_store_id` INT(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '售卖门店ID（0为总部）' AFTER `remark`,
ADD COLUMN `sold_time` INT(11) NOT NULL DEFAULT '0' COMMENT '售卖时间' AFTER `sold_store_id`;


