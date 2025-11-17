<?php
/**
 * 生成批量测试数据
 * 运行：php scripts/seed_test_data.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../api/models/Database.php';

use App\Models\Database;

echo "初始化测试数据...\n";
$db = Database::getInstance()->getConnection();
$now = time();

/** ---------- 基础工具函数 ---------- */
function upsertStore(PDO $db, $code, $name, $address, $phone)
{
    $stmt = $db->prepare("SELECT id FROM uc_stores WHERE store_code = ? LIMIT 1");
    $stmt->execute([$code]);
    $store = $stmt->fetch();
    if ($store) {
        $update = $db->prepare("UPDATE uc_stores SET store_name = ?, store_address = ?, store_phone = ?, status = 1, is_deleted = 0, update_time = ? WHERE id = ?");
        $update->execute([$name, $address, $phone, time(), $store['id']]);
        return $store['id'];
    }
    $insert = $db->prepare("INSERT INTO uc_stores (store_code, store_name, store_address, store_phone, status, is_deleted, create_time, update_time) VALUES (?, ?, ?, ?, 1, 0, ?, ?)");
    $insert->execute([$code, $name, $address, $phone, time(), time()]);
    return $db->lastInsertId();
}

function ensureUser(PDO $db, $username, $role, $storeId = 0)
{
    $stmt = $db->prepare("SELECT id FROM uc_users WHERE username = ? LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    if ($user) {
        return $user['id'];
    }
    $password = password_hash('password', PASSWORD_BCRYPT);
    $insert = $db->prepare("INSERT INTO uc_users (username, password, real_name, role, store_id, status, create_time, update_time) VALUES (?, ?, ?, ?, ?, 1, ?, ?)");
    $insert->execute([$username, $password, ucfirst($username), $role, $storeId, time(), time()]);
    return $db->lastInsertId();
}

function ensureStoreAdmin(PDO $db, $storeId, $storeName)
{
    $stmt = $db->prepare("SELECT id FROM uc_users WHERE store_id = ? AND role = 'store_admin' LIMIT 1");
    $stmt->execute([$storeId]);
    $user = $stmt->fetch();
    if ($user) {
        return $user['id'];
    }
    $username = 'store' . $storeId . '_admin';
    return ensureUser($db, $username, 'store_admin', $storeId);
}

function cleanSeedData(PDO $db)
{
    $db->exec("DELETE FROM uc_car_authorizations WHERE car_id IN (SELECT id FROM uc_cars WHERE vin LIKE 'SEED%')");
    $db->exec("DELETE FROM uc_cars WHERE vin LIKE 'SEED%'");
}

function randomBrand()
{
    $brands = [
        ['brand' => '奔驰', 'series' => 'C260L', 'color' => '白色'],
        ['brand' => '宝马', 'series' => 'X3', 'color' => '蓝色'],
        ['brand' => '奥迪', 'series' => 'A6L', 'color' => '黑色'],
        ['brand' => '特斯拉', 'series' => 'Model 3', 'color' => '红色'],
        ['brand' => '保时捷', 'series' => 'Macan', 'color' => '银色'],
        ['brand' => '蔚来', 'series' => 'ES6', 'color' => '灰色'],
        ['brand' => '理想', 'series' => 'L8', 'color' => '绿色'],
        ['brand' => '比亚迪', 'series' => '汉EV', 'color' => '白色'],
        ['brand' => '捷豹', 'series' => 'XFL', 'color' => '深蓝色'],
    ];
    return $brands[array_rand($brands)];
}

function pickOtherStore(array $stores, $selfId)
{
    $candidates = array_filter($stores, fn($s) => $s['id'] != $selfId);
    if (empty($candidates)) {
        return null;
    }
    return $candidates[array_rand($candidates)];
}

function generatePlate($storeId, $index)
{
    $prefix = ['京', '沪', '粤', '浙', '苏', '渝', '津'];
    $city = $prefix[$storeId % count($prefix)];
    return sprintf('%s·SEED%02d', $city, $index);
}

function upsertCar(PDO $db, array $data)
{
    $stmt = $db->prepare("SELECT id FROM uc_cars WHERE vin = ? LIMIT 1");
    $stmt->execute([$data['vin']]);
    $existing = $stmt->fetch();
    if ($existing) {
        $sql = "UPDATE uc_cars SET store_id=?, input_user_id=?, brand=?, series=?, color=?, first_register_time=?, years=?,
                plate_number=?, mileage=?, condition_description=?, purchase_price=?, purchase_time=?, car_status=?,
                audit_status=?, displacement=?, transmission=?, fuel_type=?, emission_standard=?, transfer_count=?,
                insurance_expire_time=?, inspection_expire_time=?, car_config=?, accident_record=?, maintenance_record=?,
                remark=?, update_time=?, reserved_store_id=?, reserved_time=?, sold_store_id=?, sold_time=?, submit_headquarters_time=?,
                audit_user_id=?, audit_time=? WHERE id=?";
        $db->prepare($sql)->execute([
            $data['store_id'], $data['input_user_id'], $data['brand'], $data['series'], $data['color'],
            $data['first_register_time'], $data['years'], $data['plate_number'], $data['mileage'],
            $data['condition_description'], $data['purchase_price'], $data['purchase_time'], $data['car_status'],
            $data['audit_status'], $data['displacement'], $data['transmission'], $data['fuel_type'], $data['emission_standard'],
            $data['transfer_count'], $data['insurance_expire_time'], $data['inspection_expire_time'], $data['car_config'],
            $data['accident_record'], $data['maintenance_record'], $data['remark'], time(), $data['reserved_store_id'],
            $data['reserved_time'], $data['sold_store_id'], $data['sold_time'], $data['submit_headquarters_time'],
            $data['audit_user_id'], $data['audit_time'], $existing['id']
        ]);
        return $existing['id'];
    }

    $sql = "INSERT INTO uc_cars (
        store_id, input_user_id, brand, series, color, first_register_time, years,
        vin, plate_number, mileage, condition_description, purchase_price, purchase_time,
        car_status, audit_status, displacement, transmission, fuel_type, emission_standard,
        transfer_count, insurance_expire_time, inspection_expire_time, car_config,
        accident_record, maintenance_record, remark, create_time, update_time,
        reserved_store_id, reserved_time, sold_store_id, sold_time, submit_headquarters_time,
        audit_user_id, audit_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $db->prepare($sql)->execute([
        $data['store_id'], $data['input_user_id'], $data['brand'], $data['series'], $data['color'],
        $data['first_register_time'], $data['years'], $data['vin'], $data['plate_number'], $data['mileage'],
        $data['condition_description'], $data['purchase_price'], $data['purchase_time'], $data['car_status'],
        $data['audit_status'], $data['displacement'], $data['transmission'], $data['fuel_type'], $data['emission_standard'],
        $data['transfer_count'], $data['insurance_expire_time'], $data['inspection_expire_time'], $data['car_config'],
        $data['accident_record'], $data['maintenance_record'], $data['remark'], time(), time(),
        $data['reserved_store_id'], $data['reserved_time'], $data['sold_store_id'], $data['sold_time'],
        $data['submit_headquarters_time'], $data['audit_user_id'], $data['audit_time']
    ]);
    return $db->lastInsertId();
}

function createSeedCar(PDO $db, $store, $inputUserId, $status, $seq, $allStores, $hqUserId)
{
    $brand = randomBrand();
    $purchaseDaysAgo = rand(30, 360);
    $purchaseTime = time() - $purchaseDaysAgo * 86400;
    $firstReg = date('Y-m-d', time() - rand(400, 1800) * 86400);
    $years = max(1, intval((time() - strtotime($firstReg)) / (365 * 86400)));

    $statusPrefix = [
        '待上架' => 'P',
        '待出售' => 'S',
        '已预定' => 'R',
        '已售出' => 'C'
    ];
    $prefix = $statusPrefix[$status] ?? 'X';
    $vin = sprintf('SEED%03d%s%03d', $store['id'], $prefix, $seq);
    $plate = generatePlate($store['id'], $seq);

    $data = [
        'store_id' => $store['id'],
        'input_user_id' => $inputUserId,
        'brand' => $brand['brand'],
        'series' => $brand['series'],
        'color' => $brand['color'],
        'first_register_time' => $firstReg,
        'years' => $years,
        'vin' => $vin,
        'plate_number' => $plate,
        'mileage' => rand(8000, 80000),
        'condition_description' => '保养良好，支持现场检测，来源可靠。',
        'purchase_price' => rand(18, 45) * 10000,
        'purchase_time' => $purchaseTime,
        'car_status' => $status,
        'audit_status' => $status === '待上架' ? '待审核' : '审核通过',
        'displacement' => rand(15, 30) / 10 . 'T',
        'transmission' => rand(0, 1) ? '自动' : '手自一体',
        'fuel_type' => rand(0, 1) ? '汽油' : '混动',
        'emission_standard' => '国VI',
        'transfer_count' => rand(0, 2),
        'insurance_expire_time' => date('Y-m-d', time() + rand(120, 360) * 86400),
        'inspection_expire_time' => date('Y-m-d', time() + rand(180, 400) * 86400),
        'car_config' => '',
        'accident_record' => '无重大事故',
        'maintenance_record' => '4S店完整保养记录',
        'remark' => '测试数据',
        'reserved_store_id' => 0,
        'reserved_time' => 0,
        'sold_store_id' => 0,
        'sold_time' => 0,
        'submit_headquarters_time' => $status === '待上架' ? 0 : (time() - rand(10, 60) * 86400),
        'audit_user_id' => $status === '待上架' ? 0 : $hqUserId,
        'audit_time' => $status === '待上架' ? 0 : (time() - rand(5, 20) * 86400),
    ];

    if ($status === '已预定') {
        $other = pickOtherStore($allStores, $store['id']);
        if ($other) {
            $data['reserved_store_id'] = $other['id'];
            $data['reserved_time'] = time() - rand(1, 10) * 86400;
        }
    }

    if ($status === '已售出') {
        $data['sold_store_id'] = $store['id'];
        $data['sold_time'] = time() - rand(1, 30) * 86400;
    }

    $carId = upsertCar($db, $data);
    return ['id' => $carId, 'status' => $status, 'store_id' => $store['id']];
}

function assignAuthorizations(PDO $db, array $carInfo, array $allStores, $hqUserId)
{
    $other = pickOtherStore($allStores, $carInfo['store_id']);
    if (!$other) {
        return;
    }
    $stmt = $db->prepare("SELECT id FROM uc_car_authorizations WHERE car_id = ? AND authorized_store_id = ? AND is_revoked = 0");
    $stmt->execute([$carInfo['id'], $other['id']]);
    if ($stmt->fetch()) {
        return;
    }
    $insert = $db->prepare("INSERT INTO uc_car_authorizations (car_id, authorized_store_id, authorize_user_id, authorize_time, is_revoked) VALUES (?, ?, ?, ?, 0)");
    $insert->execute([$carInfo['id'], $other['id'], $hqUserId, time()]);
}

/** ---------- 数据生成流程 ---------- */
echo "准备基础门店...\n";
$storeBJ = upsertStore($db, 'BJ001', '北京朝阳旗舰店', '北京市朝阳区酒仙桥路99号', '010-88886666');
$storeSH = upsertStore($db, 'SH001', '上海浦东体验店', '上海市浦东新区陆家嘴环路88号', '021-88889999');
$storeGZ = upsertStore($db, 'GZ001', '广州天河服务中心', '广州市天河区体育西路123号', '020-77775555');

// 补充更多默认门店（如已存在则跳过）
$storeHZ = upsertStore($db, 'HZ001', '杭州滨江直营店', '杭州市滨江区江陵路88号', '0571-55553333');
$storeSZ = upsertStore($db, 'SZ001', '深圳福田交付中心', '深圳市福田区车公庙路66号', '0755-22223333');

echo "准备用户...\n";
$hqUserId = ensureUser($db, 'hq_admin', 'headquarters_admin', 0);

echo "清理旧的种子数据...\n";
cleanSeedData($db);

echo "生成车源数据...\n";
$storesStmt = $db->query("SELECT id, store_name FROM uc_stores WHERE is_deleted = 0 AND status = 1");
$stores = $storesStmt ? $storesStmt->fetchAll() : [];
$seedCars = [];
$seqMap = [];

foreach ($stores as $store) {
    $storeId = intval($store['id']);
    if ($storeId <= 0) {
        continue; // 仅为真实门店生成
    }
    $seqMap[$storeId] = 1;
    $adminId = ensureStoreAdmin($db, $storeId, $store['store_name']);

    $pendingCount = rand(2, 3);
    $saleCount = rand(6, 8);
    $reservedCount = rand(1, 2);
    $soldCount = rand(3, 4);

    foreach ([
        ['status' => '待上架', 'count' => $pendingCount],
        ['status' => '待出售', 'count' => $saleCount],
        ['status' => '已预定', 'count' => $reservedCount],
        ['status' => '已售出', 'count' => $soldCount],
    ] as $group) {
        for ($i = 0; $i < $group['count']; $i++) {
            $carInfo = createSeedCar(
                $db,
                $store,
                $adminId,
                $group['status'],
                $seqMap[$storeId]++,
                $stores,
                $hqUserId
            );
            $seedCars[] = $carInfo;
        }
    }
}

echo "生成授权关系...\n";
foreach ($seedCars as $car) {
    if (in_array($car['status'], ['待出售', '已预定'])) {
        assignAuthorizations($db, $car, $stores, $hqUserId);
    }
}

echo "✅ 已为 " . count($seedCars) . " 条车源生成测试数据。\n";

