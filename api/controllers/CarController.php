<?php
/**
 * 车源管理控制器
 */

namespace App\Controllers;

use App\Models\Car;
use App\Models\CarImage;
use App\Models\CarAuthorization;
use App\Models\Store;
use App\Middleware\Auth;
use App\Utils\Response;
use App\Utils\Request;

class CarController
{
    /**
     * 获取车源列表
     */
    public function list()
    {
        $payload = Auth::verifyToken();
        
        $data = Request::getData();
        $params = [
            'page' => isset($data['page']) ? intval($data['page']) : 1,
            'limit' => isset($data['limit']) ? intval($data['limit']) : 15,
            'keyword' => isset($data['keyword']) ? trim($data['keyword']) : '',
            'brand' => isset($data['brand']) ? trim($data['brand']) : '',
            'car_status' => isset($data['car_status']) ? trim($data['car_status']) : '',
            'audit_status' => isset($data['audit_status']) ? trim($data['audit_status']) : '',
            'sort_field' => isset($data['sort_field']) ? trim($data['sort_field']) : '',
            'sort_order' => isset($data['sort_order']) ? trim($data['sort_order']) : '',
        ];
        // 接收多选状态 car_statuses（数组或逗号分隔字符串）
        if (isset($data['car_statuses'])) {
            if (is_array($data['car_statuses'])) {
                $params['car_statuses'] = array_values(array_filter(array_map('trim', $data['car_statuses'])));
            } else {
                $parts = array_map('trim', explode(',', (string)$data['car_statuses']));
                $params['car_statuses'] = array_values(array_filter($parts));
            }
            // 若有多选，单选字段不再生效
            if (!empty($params['car_statuses'])) {
                unset($params['car_status']);
            }
        }
        
        // 先检查是否查询待上架/待审核状态，如果是，强制仅本机构可见
        $requestedStatus = $params['car_status'] ?? '';
        $hasPendingStatus = false;
        if ($requestedStatus === '待上架' || $requestedStatus === '待审核') {
            $hasPendingStatus = true;
        }
        if (!empty($params['car_statuses']) && (in_array('待上架', $params['car_statuses'], true) || in_array('待审核', $params['car_statuses'], true))) {
            $hasPendingStatus = true;
        }
        
        // 如果查询待上架/待审核，强制仅本机构可见（总部=0，门店=store_id）
        if ($hasPendingStatus) {
            if (($payload['role'] ?? '') === 'headquarters_admin') {
                $params['store_id'] = 0;
            } else {
                $params['store_id'] = intval($payload['store_id'] ?? 0);
            }
            // 清除所有授权相关参数，强制仅本机构
            unset($params['authorized_store_id'], $params['store_id_or_authorized'], $params['input_user_id']);
        } else {
            // 非待上架状态，按正常逻辑过滤
            // 车源列表默认排除待上架状态（待上架车源在待审核列表中显示）
            if (empty($params['car_statuses']) && empty($params['car_status'])) {
                // 如果没有指定状态筛选，默认排除待上架
                $params['exclude_statuses'] = ['待上架', '待审核'];
            }
            
            if ($payload['role'] == 'headquarters_admin') {
                // 总部可以看到所有
            } elseif ($payload['role'] == 'store_admin') {
                // 门店管理员：本店 + 授权车源
                $filterType = $data['filter_type'] ?? 'all'; // all/store/other
                
                if ($filterType == 'store') {
                    $params['store_id'] = $payload['store_id'];
                } elseif ($filterType == 'other') {
                    $params['authorized_store_id'] = $payload['store_id'];
                } else {
                    // all: 合并本店和授权车源
                    $params['store_id_or_authorized'] = $payload['store_id'];
                }
            } elseif ($payload['role'] == 'store_input') {
                // 录入员：只能看自己录入的（未审核前），审核通过后所有本店人员都能看到
                $auditStatus = $data['audit_status'] ?? '';
                if ($auditStatus != '审核通过') {
                    $params['input_user_id'] = $payload['user_id'];
                } else {
                    $params['store_id'] = $payload['store_id'];
                }
            }
        }
        
        $carModel = new Car();
        $result = $carModel->getList($params);
        
        // 处理授权车源标识
        $authModel = new CarAuthorization();
        foreach ($result['list'] as &$car) {
            if ($payload['role'] != 'headquarters_admin' && $car['store_id'] != $payload['store_id']) {
                $car['is_authorized'] = true;
            } else {
                $car['is_authorized'] = false;
            }
        }
        
        Response::paginate($result['list'], $result['total'], $params['page'], $params['limit']);
    }
    
    /**
     * 获取车源详情
     */
    public function detail()
    {
        $payload = Auth::verifyToken();
        
        $data = Request::getData();
        $id = isset($data['id']) ? intval($data['id']) : 0;
        if (!$id) {
            Response::error('车源ID不能为空');
        }
        
        $carModel = new Car();
        $car = $carModel->getById($id);
        
        if (!$car) {
            Response::error('车源不存在');
        }
        
        // 权益信息：返回已授权门店列表，供前端决定是否显示售卖/来源
        $authModel = new CarAuthorization();
        $car['authorized_stores'] = $authModel->getAuthorizedStores($id);
        
        // 图片信息：车辆照片与绿本照片
        $imageModel = new CarImage();
        $car['images'] = $imageModel->getByCarId($id);
        
        // 权限检查
        $carStoreId = intval($car['store_id'] ?? -1);
        $userStoreId = ($payload['role'] ?? '') === 'headquarters_admin' ? 0 : intval($payload['store_id'] ?? -1);
        $isOwner = $carStoreId === $userStoreId;
        
        // 待上架/待审核状态：仅录入机构可见（总部可见所有）
        if (($car['car_status'] ?? '') === '待上架' || ($car['car_status'] ?? '') === '待审核' || ($car['audit_status'] ?? '') === '待审核') {
            if (($payload['role'] ?? '') === 'headquarters_admin') {
                // 总部可见所有待上架车源
            } elseif ($payload['role'] == 'store_input' || $payload['role'] == 'store_admin') {
                // 门店：仅可见本店录入的待上架车源
                if (!$isOwner) {
                    Response::error('无权查看该车源（待上架状态仅录入机构可见）', 403);
                }
            }
        } else {
            // 其他状态：总部/收车机构/被授权门店可见
            // 检查是否被授权（检查当前用户的store_id是否在授权列表中）
            $isAuthorized = false;
            if (!$isOwner && ($payload['role'] == 'store_input' || $payload['role'] == 'store_admin')) {
                $currentStoreId = intval($payload['store_id'] ?? -1);
                $isAuthorized = array_reduce($car['authorized_stores'] ?? [], function($carry, $it) use ($currentStoreId) { 
                    $authorizedStoreId = intval($it['authorized_store_id'] ?? -1);
                    return $carry || ($authorizedStoreId > 0 && $authorizedStoreId === $currentStoreId); 
                }, false);
            }
            
            if (($payload['role'] ?? '') === 'headquarters_admin') {
                // 总部可见所有车源
            } elseif ($payload['role'] == 'store_input' || $payload['role'] == 'store_admin') {
                // 门店：本店收车或被授权的车源都能查看
                if (!$isOwner && !$isAuthorized) {
                    Response::error('无权查看该车源', 403);
                }
            }
        }
        
        Response::success($car);
    }
    
    /**
     * 创建车源
     */
    public function create()
    {
        $payload = Auth::checkRole(['store_input', 'headquarters_admin']);
        
        $postData = Request::getData();
        
        $data = [
            // 总部录入的车源归属总部（store_id=0），门店录入归属各自门店
            'store_id' => $payload['role'] === 'headquarters_admin' ? 0 : $payload['store_id'],
            'input_user_id' => $payload['user_id'],
            'brand' => trim($postData['brand'] ?? ''),
            'series' => trim($postData['series'] ?? ''),
            'color' => trim($postData['color'] ?? ''),
            'first_register_time' => trim($postData['first_register_time'] ?? ''),
            'vin' => trim($postData['vin'] ?? ''),
            'plate_number' => trim($postData['plate_number'] ?? ''),
            'mileage' => isset($postData['mileage']) ? floatval($postData['mileage']) : 0,
            'condition_description' => trim($postData['condition_description'] ?? ''),
            'purchase_price' => isset($postData['purchase_price']) ? floatval($postData['purchase_price']) : 0,
            'car_status' => trim($postData['car_status'] ?? '收钥匙'),
            'displacement' => trim($postData['displacement'] ?? ''),
            'transmission' => trim($postData['transmission'] ?? ''),
            'fuel_type' => trim($postData['fuel_type'] ?? ''),
            'emission_standard' => trim($postData['emission_standard'] ?? ''),
            'transfer_count' => isset($postData['transfer_count']) ? intval($postData['transfer_count']) : 0,
            'insurance_expire_time' => !empty($postData['insurance_expire_time']) ? trim($postData['insurance_expire_time']) : null,
            'inspection_expire_time' => !empty($postData['inspection_expire_time']) ? trim($postData['inspection_expire_time']) : null,
            'car_config' => trim($postData['car_config'] ?? ''),
            'accident_record' => trim($postData['accident_record'] ?? ''),
            'maintenance_record' => trim($postData['maintenance_record'] ?? ''),
            'remark' => trim($postData['remark'] ?? '')
        ];
        
        // 验证必填字段
        $required = [
            'brand' => '品牌',
            'series' => '车型/车系',
            'color' => '颜色',
            'first_register_time' => '首次上牌时间',
            'vin' => '车架号',
            'plate_number' => '车牌号',
            'mileage' => '公里数',
            'condition_description' => '车况描述',
            'purchase_price' => '收车价'
        ];
        
        foreach ($required as $field => $fieldName) {
            if (empty($data[$field])) {
                Response::error("{$fieldName}为必填项");
            }
        }
        
        // 检查VIN是否已存在
        $carModel = new Car();
        if (!empty($data['vin'])) {
            $existingCar = $carModel->getByVin($data['vin']);
            if ($existingCar) {
                Response::error('车架号(VIN)已存在，不能重复');
            }
        }
        
        $carId = $carModel->create($data);
        
        // 保存图片
        $imageModel = new CarImage();
        $carImages = json_decode($postData['car_images'] ?? '[]', true);
        $greenBookImages = json_decode($postData['green_book_images'] ?? '[]', true);
        
        foreach ($carImages as $index => $imageUrl) {
            $imageModel->add($carId, 'car', $imageUrl, $index);
        }
        
        foreach ($greenBookImages as $index => $imageUrl) {
            $imageModel->add($carId, 'green_book', $imageUrl, $index);
        }
        
        Response::success(['id' => $carId], '车源创建成功');
    }
    
    /**
     * 更新车源
     */
    public function update()
    {
        $payload = Auth::checkRole(['store_input']);
        
        $postData = Request::getData();
        $id = isset($postData['id']) ? intval($postData['id']) : 0;
        if (!$id) {
            Response::error('车源ID不能为空');
        }
        
        $carModel = new Car();
        $car = $carModel->getById($id);
        
        if (!$car) {
            Response::error('车源不存在');
        }
        
        // 只能修改自己录入的未审核车源
        if ($car['input_user_id'] != $payload['user_id']) {
            Response::error('只能修改自己录入的车源');
        }
        
        if ($car['audit_status'] != '待审核' && $car['audit_status'] != '审核驳回') {
            Response::error('已审核通过的车源不能修改');
        }
        
        $data = [];
        $allowedFields = ['brand', 'series', 'color', 'first_register_time', 'vin', 'plate_number',
            'mileage', 'condition_description', 'purchase_price', 'car_status', 'displacement', 'transmission',
            'fuel_type', 'emission_standard', 'transfer_count', 'insurance_expire_time', 'inspection_expire_time',
            'car_config', 'accident_record', 'maintenance_record', 'remark'];
        
        foreach ($allowedFields as $field) {
            if (isset($postData[$field])) {
                $data[$field] = is_string($postData[$field]) ? trim($postData[$field]) : $postData[$field];
            }
        }
        
        // 检查VIN是否已存在（排除当前车源）
        if (isset($data['vin']) && !empty($data['vin']) && $data['vin'] !== $car['vin']) {
            $existingCar = $carModel->getByVin($data['vin']);
            if ($existingCar && $existingCar['id'] != $id) {
                Response::error('车架号(VIN)已存在，不能重复');
            }
        }
        
        $carModel->update($id, $data);
        
        // 更新图片
        $imageModel = new CarImage();
        $imageModel->deleteByCarId($id);
        
        $carImages = json_decode($postData['car_images'] ?? '[]', true);
        $greenBookImages = json_decode($postData['green_book_images'] ?? '[]', true);
        
        foreach ($carImages as $index => $imageUrl) {
            $imageModel->add($id, 'car', $imageUrl, $index);
        }
        
        foreach ($greenBookImages as $index => $imageUrl) {
            $imageModel->add($id, 'green_book', $imageUrl, $index);
        }
        
        Response::success([], '更新成功');
    }
    
    /**
     * 审核车源
     */
    public function audit()
    {
        $payload = Auth::checkRole(['store_admin', 'headquarters_admin']);
        
        $postData = Request::getData();
        $id = isset($postData['id']) ? intval($postData['id']) : 0;
        $auditStatus = trim($postData['audit_status'] ?? '');
        $auditRemark = trim($postData['audit_remark'] ?? '');
        
        if (!$id) {
            Response::error('车源ID不能为空');
        }
        
        if (!in_array($auditStatus, ['审核通过', '审核驳回'])) {
            Response::error('审核状态无效');
        }
        
        $carModel = new Car();
        $car = $carModel->getById($id);
        
        if (!$car) {
            Response::error('车源不存在');
        }
        
        // 权限：门店管理员只能审核本店车源；总部只能审核总部车源（store_id=0）
        if ($payload['role'] === 'store_admin') {
            if ($car['store_id'] != $payload['store_id']) {
                Response::error('只能审核本店车源');
            }
        } else if ($payload['role'] === 'headquarters_admin') {
            if (intval($car['store_id']) !== 0) {
                Response::error('总部只能审核总部车源');
            }
        }
        
        if ($car['audit_status'] != '待审核') {
            Response::error('该车源已审核');
        }
        
        if ($auditStatus == '审核驳回' && !$auditRemark) {
            Response::error('审核驳回必须填写驳回原因');
        }
        
        $carModel->audit($id, $auditStatus, $payload['user_id'], $auditRemark);
        
        Response::success([], '审核成功');
    }
    
    /**
     * 授权车源（总部/收车机构功能）
     */
    public function authorize()
    {
        $payload = Auth::verifyToken();
        
        $postData = Request::getData();
        $carId = isset($postData['car_id']) ? intval($postData['car_id']) : 0;
        $storeIds = json_decode($postData['store_ids'] ?? '[]', true);
        
        if (!$carId || empty($storeIds)) {
            Response::error('车源ID和门店ID不能为空');
        }
        
        // 权限检查：仅总部或收车机构可授权（他店授权过来的车源不可授权）
        $carModel = new Car();
        $car = $carModel->getById($carId);
        if (!$car) {
            Response::error('车源不存在');
        }
        
        $carStoreId = intval($car['store_id'] ?? 0);
        $userStoreId = ($payload['role'] ?? '') === 'headquarters_admin' ? 0 : intval($payload['store_id'] ?? -1);
        
        // 仅总部或收车机构可授权（他店授权过来的车源不可授权）
        if (($payload['role'] ?? '') !== 'headquarters_admin') {
            // 门店管理员：仅本店收车可授权
            if ($carStoreId !== $userStoreId) {
                Response::error('仅本店收车可授权，他店授权过来的车源不可授权', 403);
            }
        }
        // 总部：可授权所有车源（包括总部收车和门店收车）
        
        // 过滤掉收车机构和总部（0），因为收车机构本身就有权限，总部也有权限，不需要额外授权
        $carStoreId = intval($car['store_id'] ?? 0);
        $storeIds = array_filter($storeIds, function($sid) use ($carStoreId) {
            $sid = intval($sid);
            return $sid > 0 && $sid !== $carStoreId; // 排除总部(0)和收车机构
        });
        
        if (empty($storeIds)) {
            Response::error('授权门店列表为空（已排除收车机构和总部）');
        }
        
        $authModel = new CarAuthorization();
        $result = $authModel->authorize($carId, $storeIds, $payload['user_id']);
        
        if ($result) {
            Response::success([], '授权成功');
        } else {
            Response::error('授权失败');
        }
    }
    
    /**
     * 收回授权（总部功能）
     */
    public function revoke()
    {
        $payload = Auth::checkRole(['headquarters_admin']);
        
        $postData = Request::getData();
        $carId = isset($postData['car_id']) ? intval($postData['car_id']) : 0;
        $storeIds = json_decode($postData['store_ids'] ?? '[]', true);
        
        if (!$carId || empty($storeIds)) {
            Response::error('车源ID和门店ID不能为空');
        }
        
        $authModel = new CarAuthorization();
        $result = $authModel->revoke($carId, $storeIds);
        
        if ($result) {
            Response::success([], '收回授权成功');
        } else {
            Response::error('收回失败');
        }
    }

    /**
     * 售卖车源（总部/有权限门店）
     */
    public function sell()
    {
        $payload = Auth::verifyToken();
        $postData = Request::getData();
        $carId = isset($postData['car_id']) ? intval($postData['car_id']) : 0;
        // 兼容前端传参：优先 sold_store_id，其次 store_id
        $soldStoreId = isset($postData['sold_store_id']) ? intval($postData['sold_store_id']) : (isset($postData['store_id']) ? intval($postData['store_id']) : 0);

        if (!$carId) {
            Response::error('车源ID不能为空');
        }

        $carModel = new Car();
        $car = $carModel->getById($carId);
        if (!$car) {
            Response::error('车源不存在');
        }

        // 新规则：允许处于待出售或已预定的车源售卖（已预定仅允许预定门店售卖）
        if (($car['car_status'] ?? '') === '已售出') {
            Response::error('该车源已售出');
        }
        if (($car['car_status'] ?? '') === '待上架') {
            Response::error('待上架的车源不可售卖，请先上架为待出售');
        }
        if (($car['car_status'] ?? '') === '已预定') {
            $reservedStoreId = intval($car['reserved_store_id'] ?? 0);
            if ($reservedStoreId <= 0) {
                Response::error('已预定状态异常，请联系管理员');
            }
            // 仅预定门店可售卖；总部不可跨越预定限制
            if (intval($payload['store_id'] ?? -1) !== $reservedStoreId) {
                Response::error('该车源已被其他门店预定，仅预定门店可售卖');
            }
        }

        // 权限校验：总部可售任意；门店只能售自己收车或被授权的车源
        $role = $payload['role'] ?? '';
        $userStoreId = intval($payload['store_id'] ?? 0);
        $can = false;
        if ($role === 'headquarters_admin') {
            $can = true;
        } else if ($role === 'store_admin') {
            if (intval($car['store_id']) === $userStoreId) {
                $can = true;
            } else {
                $authModel = new CarAuthorization();
                $can = $authModel->hasPermission($carId, $userStoreId);
            }
        }

        if (empty($can)) {
            Response::error('无权限进行此操作', 403);
        }

        // 确定售出门店：总部可传入选择，门店固定为自身门店
        if ($role !== 'headquarters_admin') {
            $soldStoreId = $userStoreId;
        }
        if ($soldStoreId < 0) {
            $soldStoreId = 0;
        }

        $ok = $carModel->sell($carId, $soldStoreId);
        if ($ok) {
            Response::success([], '售卖成功');
        }
        Response::error('售卖失败');
    }

    /**
     * 预定车源
     */
    public function reserve()
    {
        $payload = Auth::verifyToken(); // 总部与可见门店均可预定
        $postData = Request::getData();
        $carId = isset($postData['car_id']) ? intval($postData['car_id']) : 0;
        $reserveStoreId = intval($payload['store_id'] ?? 0); // 总部预定为0，门店为本店
        if (!$carId) {
            Response::error('车源ID不能为空');
        }
        $carModel = new Car();
        $car = $carModel->getById($carId);
        if (!$car) {
            Response::error('车源不存在');
        }
        if (($car['car_status'] ?? '') === '已售出') {
            Response::error('已售出不可预定');
        }
        if (($car['car_status'] ?? '') === '已预定') {
            Response::error('该车源已被预定');
        }
        // 可见性校验（门店只能对本店或被授权车源操作）
        if (($payload['role'] ?? '') !== 'headquarters_admin') {
            if (intval($car['store_id']) !== intval($payload['store_id'])) {
                $authModel = new CarAuthorization();
                if (!$authModel->hasPermission($carId, intval($payload['store_id']))) {
                    Response::error('无权限预定该车源');
                }
            }
        }
        $ok = $carModel->reserve($carId, $reserveStoreId);
        if ($ok) {
            Response::success([], '预定成功');
        }
        Response::error('预定失败');
    }

    /**
     * 取消预定
     */
    public function unreserve()
    {
        $payload = Auth::verifyToken(); // 仅预定的主体可取消；总部预定的由总部取消
        $postData = Request::getData();
        $carId = isset($postData['car_id']) ? intval($postData['car_id']) : 0;
        if (!$carId) {
            Response::error('车源ID不能为空');
        }
        $carModel = new Car();
        $car = $carModel->getById($carId);
        if (!$car) {
            Response::error('车源不存在');
        }
        if (($car['car_status'] ?? '') !== '已预定') {
            Response::error('当前状态不可取消预定');
        }
        $reservedStoreId = intval($car['reserved_store_id'] ?? -1);
        if ($reservedStoreId < 0) {
            Response::error('预定信息异常');
        }
        // 仅预定主体可取消
        if (($payload['role'] ?? '') === 'headquarters_admin') {
            if ($reservedStoreId !== 0) {
                Response::error('该车源由门店预定，仅预定门店可取消');
            }
        } else {
            if (intval($payload['store_id'] ?? -1) !== $reservedStoreId) {
                Response::error('仅预定门店可取消该预定');
            }
        }
        $ok = $carModel->unreserve($carId);
        if ($ok) {
            Response::success([], '已取消预定');
        }
        Response::error('取消预定失败');
    }

    /**
     * 上架（从待上架 -> 待出售）
     */
    public function publish()
    {
        $payload = Auth::verifyToken();
        $postData = Request::getData();
        $carId = isset($postData['car_id']) ? intval($postData['car_id']) : 0;
        if (!$carId) {
            Response::error('车源ID不能为空');
        }
        $carModel = new Car();
        $car = $carModel->getById($carId);
        if (!$car) {
            Response::error('车源不存在');
        }
        if (($car['car_status'] ?? '') !== '待上架') {
            Response::error('仅待上架车源可上架');
        }
        // 权限：总部只能上架总部车源；门店只能上架本店车源
        if (($payload['role'] ?? '') === 'headquarters_admin') {
            if (intval($car['store_id']) !== 0) {
                Response::error('总部仅能上架总部车源');
            }
        } else {
            if (intval($car['store_id']) !== intval($payload['store_id'] ?? -1)) {
                Response::error('仅能上架本店车源');
            }
        }
        $ok = $carModel->update($carId, ['car_status' => '待出售']);
        if ($ok) {
            Response::success([], '上架成功');
        }
        Response::error('上架失败');
    }
}
