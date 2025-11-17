-- 添加预定字段（如果不存在）
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'uc_cars' 
    AND COLUMN_NAME = 'reserved_store_id');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `uc_cars` ADD COLUMN `reserved_store_id` INT(11) UNSIGNED NOT NULL DEFAULT ''0'' COMMENT ''预定门店ID（0为总部）'' AFTER `sold_time`', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'uc_cars' 
    AND COLUMN_NAME = 'reserved_time');
SET @sql2 = IF(@col_exists2 = 0, 
    'ALTER TABLE `uc_cars` ADD COLUMN `reserved_time` INT(11) NOT NULL DEFAULT ''0'' COMMENT ''预定时间'' AFTER `reserved_store_id`', 
    'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 将旧的审核状态向新状态兼容（如存在旧字段，可在应用层逐步迁移）
-- 示例：把 '待审核' 视为 '待上架'，把 '审核通过' 视为 '待出售'
-- 不直接在此处修改字段，避免影响已有数据流，由应用层读写统一到 car_status。


