/**
 * POST /api/plot/unlock
 * 
 * 解锁地块
 * 
 * 请求体:
 * {
 *   "plotIndex": 6
 * }
 * 
 * 响应:
 * {
 *   "success": true,
 *   "plotIndex": 6,
 *   "cost": 1000,
 *   "levelRequired": 5,
 *   "remainingCoins": 500
 * }
 */

import { NextApiResponse } from 'next';
import { withAuth } from '@/middleware/withAuth';
import { AuthenticatedRequest } from '@/types/api';
import { PLOT_PRICES } from '@/constants';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: '只支持 POST 请求',
    });
  }

  try {
    const { plotIndex } = req.body;
    const user = req.user;

    // 1. 验证 plotIndex
    if (typeof plotIndex !== 'number' || plotIndex < 0 || plotIndex >= 18) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'plotIndex 必须是 0-17 之间的数字',
      });
    }

    // 2. 获取地块配置
    const plotConfig = PLOT_PRICES[plotIndex];
    if (!plotConfig) {
      return res.status(404).json({
        error: 'Plot not found',
        message: `未找到地块配置: ${plotIndex}`,
      });
    }

    // 3. 检查地块是否已解锁
    const plot = user.plots_list.find((p) => p.plot_index === plotIndex);
    if (!plot) {
      return res.status(404).json({
        error: 'Plot not found in user',
        message: `用户没有地块索引: ${plotIndex}`,
      });
    }

    if (plot.unlocked) {
      return res.status(400).json({
        error: 'Already unlocked',
        message: `地块 ${plotIndex} 已经解锁`,
      });
    }

    // 4. 验证等级要求
    if (user.level < plotConfig.levelReq) {
      return res.status(400).json({
        error: 'Level requirement not met',
        message: `需要等级 ${plotConfig.levelReq}，当前等级 ${user.level}`,
        currentLevel: user.level,
        requiredLevel: plotConfig.levelReq,
      });
    }

    // 5. 验证金币是否足够
    if (user.coins < plotConfig.unlockCost) {
      return res.status(400).json({
        error: 'Insufficient coins',
        message: `金币不足。需要 ${plotConfig.unlockCost}，当前 ${user.coins}`,
        requiredCoins: plotConfig.unlockCost,
        currentCoins: user.coins,
      });
    }

    // 6. 原子更新：扣除金币，解锁地块
    user.coins -= plotConfig.unlockCost;
    plot.unlocked = true;

    await user.save();

    console.log(
      `[POST /api/plot/unlock] User ${user.wallet_address} unlocked plot ${plotIndex} for ${plotConfig.unlockCost} coins`
    );

    return res.status(200).json({
      success: true,
      plotIndex,
      cost: plotConfig.unlockCost,
      levelRequired: plotConfig.levelReq,
      remainingCoins: user.coins,
      message: `成功解锁地块 ${plotIndex}！`,
    });

  } catch (error) {
    console.error('[POST /api/plot/unlock] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : '解锁地块失败',
    });
  }
}

export default withAuth(handler);
