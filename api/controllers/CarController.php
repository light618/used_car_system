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
            'limit' => isset($data['limit']) ? intval($data['limit']) : 20,
            'keyword' => isset($data['keyword']) ? trim($data['keyword']) : '',
            'brand' => isset($data['brand']) ? trim($data['brand']) : '',
            'car_status' => isset($data['car_status']) ? trim($data['car_status']) : '',
            'audit_status' => isset($data['audit_status']) ? trim($data['audit_status']) : '',
        ];
        
        // 根据角色设置数据过滤
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
        
        // 权限检查
        if ($payload['role'] == 'store_input') {
            // 录入员只能看自己录入的（未审核前）
            if ($car['audit_status'] != '审核通过' && $car['input_user_id'] != $payload['user_id']) {
                Response::error('无权限查看');
            }
        } elseif ($payload['role'] == 'store_admin') {
            // 门店管理员：本店或授权车源
            if ($car['store_id'] != $payload['store_id']) {
                $authModel = new CarAuthorization();
                if (!$authModel->hasPermission($id, $payload['store_id'])) {
                    Response::error('无权限查看');
                }
            }
        }
        
        // 获取图片
        $imageModel = new CarImage();
        $car['images'] = $imageModel->getByCarId($id);
        
        // 获取授权门店列表（如果是本店车源且是总部管理员）
        if ($payload['role'] == 'headquarters_admin') {
            $authModel = new CarAuthorization();
            $car['authorized_stores'] = $authModel->getAuthorizedStores($id);
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
            'model' => trim($postData['model'] ?? ''),
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
        $allowedFields = ['brand', 'series', 'model', 'color', 'first_register_time', 'vin', 'plate_number',
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
     * 授权车源（总部功能）
     */
    public function authorize()
    {
        $payload = Auth::checkRole(['headquarters_admin']);
        
        $postData = Request::getData();
        $carId = isset($postData['car_id']) ? intval($postData['car_id']) : 0;
        $storeIds = json_decode($postData['store_ids'] ?? '[]', true);
        
        if (!$carId || empty($storeIds)) {
            Response::error('车源ID和门店ID不能为空');
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
            Response::error('收回授权失败');
        }
    }
}
