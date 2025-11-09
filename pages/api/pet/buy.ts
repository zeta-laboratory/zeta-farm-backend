/**
 * POST /api/pet/buy
 * 
 * 购买宠物（关键：必须先结算离线收益）
 * 
 * 请求体:
 * {
 *   "petId": "pet_0"
 * }
 * 
 * 响应:
 * {
 *   "success": true,
 *   "petId": "pet_0",
 *   "petName": "阿花",
 *   "price": 500,
 *   "remainingCoins": 650,
 *   "offlineEarnings": 120,
 *   "pet_list": ["pet_0"]
 * }
 */

import { NextApiResponse } from 'next';
import { withAuth } from '@/middleware/withAuth';
import { AuthenticatedRequest } from '@/types/api';
import { PETS, calculateOfflineEarnings } from '@/constants';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: '只支持 POST 请求',
    });
  }

  try {
    const { petId } = req.body;
    const user = req.user;

    // 1. 验证 petId
    if (!petId || typeof petId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'petId 是必填项且必须是字符串',
      });
    }

    const petConfig = PETS[petId];
    if (!petConfig) {
      return res.status(404).json({
        error: 'Pet not found',
        message: `未找到宠物配置: ${petId}`,
      });
    }

    // 2. 检查是否已拥有该宠物
    if (user.pet_list.includes(petId)) {
      return res.status(400).json({
        error: 'Already owned',
        message: `你已经拥有 ${petConfig.name}`,
      });
    }

    // 3. 【关键】先结算离线收益（与 GET /api/user/state 相同逻辑）
    let offlineEarnings = 0;
    if (user.pet_list.length > 0 && user.lastOfflineClaimAt) {
      offlineEarnings = calculateOfflineEarnings(user.pet_list, user.lastOfflineClaimAt);
      
      // 结算收益
      if (offlineEarnings > 0) {
        user.coins += offlineEarnings;
        user.lastOfflineClaimAt = new Date();
        console.log(
          `[POST /api/pet/buy] Settled offline earnings for user ${user.wallet_address}: ${offlineEarnings} coins`
        );
      }
    }

    // 4. 验证金币是否足够
    if (user.coins < petConfig.price) {
      return res.status(400).json({
        error: 'Insufficient coins',
        message: `金币不足。需要 ${petConfig.price}，当前 ${user.coins}`,
      });
    }

    // 5. 原子更新：扣除金币，添加宠物，更新离线收益时间
    user.coins -= petConfig.price;
    user.pet_list.push(petId);
    
    // 如果这是第一只宠物，初始化 lastOfflineClaimAt
    if (user.pet_list.length === 1) {
      user.lastOfflineClaimAt = new Date();
    }

    await user.save();

    console.log(
      `[POST /api/pet/buy] User ${user.wallet_address} bought pet ${petId} (${petConfig.name}) for ${petConfig.price} coins`
    );

    return res.status(200).json({
      success: true,
      petId,
      petName: petConfig.name,
      price: petConfig.price,
      remainingCoins: user.coins,
      offlineEarnings,
      pet_list: user.pet_list,
      message: `成功购买宠物 ${petConfig.name}！${offlineEarnings > 0 ? `（已结算离线收益 ${offlineEarnings} 金币）` : ''}`,
    });

  } catch (error) {
    console.error('[POST /api/pet/buy] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : '购买宠物失败',
    });
  }
}

export default withAuth(handler);
