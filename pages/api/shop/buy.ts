/**
 * POST /api/shop/buy
 * 
 * 购买物品（种子、肥料等）
 * 
 * 请求体:
 * {
 *   "itemId": "seed_0" | "fertilizer",
 *   "amount": 1
 * }
 * 
 * 响应:
 * {
 *   "success": true,
 *   "itemId": "seed_0",
 *   "amount": 1,
 *   "totalCost": 10,
 *   "remainingCoins": 990
 * }
 */

import { NextApiResponse } from 'next';
import { withAuth } from '@/middleware/withAuth';
import { AuthenticatedRequest } from '@/types/api';
import { SEEDS, FERTILIZER_CONFIG } from '@/constants';
import User from '@/models/User';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: '只支持 POST 请求',
    });
  }

  try {
    const user = req.user;
    const { itemId, amount } = req.body;

    // 1. 验证参数
    if (!itemId || typeof itemId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'itemId 是必需的',
      });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'amount 必须是大于 0 的数字',
      });
    }

    // 2. 获取物品价格
    let price: number;
    let itemName: string;

    if (itemId === 'fertilizer') {
      price = FERTILIZER_CONFIG.price;
      itemName = '肥料';
    } else if (itemId.startsWith('seed_')) {
      const seed = SEEDS[itemId];
      if (!seed) {
        return res.status(400).json({
          error: 'Invalid item',
          message: `未知的种子: ${itemId}`,
        });
      }
      price = seed.cost;
      itemName = seed.name;
    } else {
      return res.status(400).json({
        error: 'Invalid item',
        message: `未知的物品类型: ${itemId}`,
      });
    }

    // 3. 计算总价
    const totalCost = price * amount;

    // 4. 验证金币余额
    if (user.coins < totalCost) {
      return res.status(400).json({
        error: 'Insufficient coins',
        message: `金币不足，需要 ${totalCost}，当前 ${user.coins}`,
      });
    }

    // 5. 原子更新：扣除金币，增加物品
    const updatedCoins = user.coins - totalCost;
    const updatedBackpack = { ...user.backpack };
    
    if (!updatedBackpack[itemId]) {
      updatedBackpack[itemId] = 0;
    }
    updatedBackpack[itemId] += amount;

    await User.updateOne(
      { wallet_address: user.wallet_address },
      {
        $set: {
          coins: updatedCoins,
          backpack: updatedBackpack,
        }
      }
    );

    console.log(
      `[POST /api/shop/buy] User ${user.wallet_address} bought ${amount}x ${itemName} for ${totalCost} coins`
    );

    return res.status(200).json({
      success: true,
      itemId,
      itemName,
      amount,
      totalCost,
      remainingCoins: updatedCoins,
      backpack: updatedBackpack,
    });

  } catch (error) {
    console.error('[POST /api/shop/buy] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : '购买失败',
    });
  }
}

export default withAuth(handler);
