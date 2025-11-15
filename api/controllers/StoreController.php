<?php
/**
 * 门店管理控制器
 */

namespace App\Controllers;

use App\Models\Store;
use App\Models\User;
use App\Middleware\Auth;
use App\Utils\Response;
use App\Utils\Request;

class StoreController
{
    /**
     * 获取门店列表
     */
    public function list()
    {
        Auth::checkRole(['headquarters_admin']);
        
        $data = Request::getData();
        $page = isset($data['page']) ? intval($data['page']) : 1;
        $limit = isset($data['limit']) ? intval($data['limit']) : 20;
        $keyword = isset($data['keyword']) ? trim($data['keyword']) : '';
        
        $storeModel = new Store();
        $result = $storeModel->getList($page, $limit, $keyword);
        
        Response::paginate($result['list'], $result['total'], $page, $limit);
    }
    
    /**
     * 获取门店详情
     */
    public function detail()
    {
        Auth::checkRole(['headquarters_admin']);
        
        $data = Request::getData();
        $id = isset($data['id']) ? intval($data['id']) : 0;
        if (!$id) {
            Response::error('门店ID不能为空');
        }
        
        $storeModel = new Store();
        $store = $storeModel->getById($id);
        
        if (!$store) {
            Response::error('门店不存在');
        }
        
        // 获取门店账号列表
        $userModel = new User();
        $users = $userModel->getStoreUsers($id);
        $store['users'] = $users;
        
        Response::success($store);
    }
    
    /**
     * 创建门店
     */
    public function create()
    {
        Auth::checkRole(['headquarters_admin']);
        
        $data = Request::getData();
        
        $storeCode = trim($data['store_code'] ?? '');
        $storeName = trim($data['store_name'] ?? '');
        $storeAddress = trim($data['store_address'] ?? '');
        $storePhone = trim($data['store_phone'] ?? '');
        
        // 验证必填字段
        if (empty($storeCode)) {
            Response::error('门店编码不能为空');
        }
        if (empty($storeName)) {
            Response::error('门店名称不能为空');
        }
        if (empty($storeAddress)) {
            Response::error('门店位置不能为空');
        }
        if (empty($storePhone)) {
            Response::error('联系电话不能为空');
        }
        
        $data = [
            'store_code' => $storeCode,
            'store_name' => $storeName,
            'store_address' => $storeAddress,
            'store_phone' => $storePhone,
            'store_description' => trim($data['store_description'] ?? ''),
            'remark' => trim($data['remark'] ?? '')
        ];
        
        $storeModel = new Store();
        
        // 检查门店编码是否已存在
        $exists = $storeModel->getByCode($data['store_code']);
        if ($exists) {
            Response::error('门店编码已存在');
        }
        
        // 创建门店
        $storeId = $storeModel->create($data);
        
        // 创建默认账号
        $userModel = new User();
        $defaultPassword = '123456'; // 默认密码
        
        // 创建录入员账号（不需要姓名）
        $userModel->create([
            'username' => $data['store_code'] . '_luru',
            'password' => $defaultPassword,
            'real_name' => '',
            'role' => 'store_input',
            'store_id' => $storeId
        ]);
        
        // 创建管理员账号（不需要姓名）
        $userModel->create([
            'username' => $data['store_code'] . '_admin',
            'password' => $defaultPassword,
            'real_name' => '',
            'role' => 'store_admin',
            'store_id' => $storeId
        ]);
        
        Response::success(['id' => $storeId], '门店创建成功');
    }
    
    /**
     * 更新门店
     */
    public function update()
    {
        Auth::checkRole(['headquarters_admin']);
        
        $data = Request::getData();
        
        $id = isset($data['id']) ? intval($data['id']) : 0;
        if (!$id) {
            Response::error('门店ID不能为空');
        }
        
        $storeName = trim($data['store_name'] ?? '');
        $storeAddress = trim($data['store_address'] ?? '');
        $storePhone = trim($data['store_phone'] ?? '');
        
        // 验证必填字段
        if (empty($storeName)) {
            Response::error('门店名称不能为空');
        }
        if (empty($storeAddress)) {
            Response::error('门店位置不能为空');
        }
        if (empty($storePhone)) {
            Response::error('联系电话不能为空');
        }
        
        $updateData = [
            'store_name' => $storeName,
            'store_address' => $storeAddress,
            'store_phone' => $storePhone,
            'store_description' => trim($data['store_description'] ?? ''),
            'remark' => trim($data['remark'] ?? '')
        ];
        
        $storeModel = new Store();
        $result = $storeModel->update($id, $updateData);
        
        if ($result) {
            Response::success([], '更新成功');
        } else {
            Response::error('更新失败');
        }
    }
    
    /**
     * 删除门店
     */
    public function delete()
    {
        Auth::checkRole(['headquarters_admin']);
        
        $data = Request::getData();
        $id = isset($data['id']) ? intval($data['id']) : 0;
        if (!$id) {
            Response::error('门店ID不能为空');
        }
        
        $storeModel = new Store();
        $result = $storeModel->delete($id);
        
        if ($result) {
            Response::success([], '删除成功');
        } else {
            Response::error('删除失败');
        }
    }
    
    /**
     * 获取所有门店（下拉选择）
     */
    public function all()
    {
        Auth::checkRole(['headquarters_admin']);
        
        $storeModel = new Store();
        $list = $storeModel->getAll();
        
        Response::success($list);
    }
}

