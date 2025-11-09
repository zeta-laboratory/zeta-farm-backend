/**
 * GET /api/user/state
 * 
 * 核心游戏状态 API - 游戏引擎
 * 
 * 功能：
 * 1. 结算宠物离线收益
 * 2. 计算所有地块的实时状态
 * 3. 自动处理地块暂停/解封（根据浇水/除草需求）
 * 4. 返回完整的用户游戏状态
 * 
 * 请求：
 * - Method: GET
 * - Headers: Authorization: <wallet_address> 或 Bearer <wallet_address>
 * 
 * 响应：
 * - 200: 完整的用户文档（包括所有更新后的数据）
 * - 401: 未授权
 * - 500: 服务器错误
 */

import { NextApiResponse } from 'next';
import { withAuth } from '@/middleware/withAuth';
import { AuthenticatedRequest } from '@/types/api';
import {
  calculatePetOfflineEarnings,
  calculatePlotStatus,
  autoHandlePlotPause,
} from '@/utils/gameLogic';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: '只支持 GET 请求' 
    });
  }

  try {
    const user = req.user;
    const now = Math.floor(Date.now() / 1000); // 当前时间（秒）

    // ========== [关键逻辑 1] 宠物离线收益结算 ==========
    
    let earnedCoins = 0;
    
    if (user.pet_list && user.pet_list.length > 0) {
      // 计算离线收益（最多累积 24 小时）
      earnedCoins = calculatePetOfflineEarnings(
        user.pet_list,
        user.lastOfflineClaimAt,
        24 // 最大累积小时数
      );

      if (earnedCoins > 0) {
        // 原子更新：增加金币，更新最后领取时间
        user.coins += earnedCoins;
        user.lastOfflineClaimAt = new Date();

        console.log(
          `[GET /api/user/state] User ${user.wallet_address} ` +
          `claimed ${earnedCoins} offline coins from pets`
        );
      }
    }

    // ========== [关键逻辑 2] 地块状态计算与自动暂停 ==========

    const plotsWithStatus = [];

    for (let i = 0; i < user.plots_list.length; i++) {
      const plot = user.plots_list[i];

      // 只处理已解锁且有作物的地块
      if (!plot.unlocked || !plot.seedId || !plot.plantedAt) {
        plotsWithStatus.push({
          plot_index: plot.plot_index,
          unlocked: plot.unlocked,
          seedId: plot.seedId,
          plantedAt: plot.plantedAt,
          pausedDuration: plot.pausedDuration,
          pausedAt: plot.pausedAt,
          waterRequirements: plot.waterRequirements,
          weedRequirements: plot.weedRequirements,
          fertilized: plot.fertilized,
          protectedUntil: plot.protectedUntil,
          status: {
            stage: 'empty',
            needsWater: false,
            hasWeeds: false,
            hasPests: false,
            effectiveElapsedTime: 0,
            progress: 0,
            isReady: false,
          },
        });
        continue;
      }

      // 计算地块状态
      const status = calculatePlotStatus(plot, now);

      // 自动处理暂停/解封
      autoHandlePlotPause(plot, status, now);

      // 添加状态信息到返回数据
      plotsWithStatus.push({
        plot_index: plot.plot_index,
        unlocked: plot.unlocked,
        seedId: plot.seedId,
        plantedAt: plot.plantedAt,
        pausedDuration: plot.pausedDuration,
        pausedAt: plot.pausedAt,
        waterRequirements: plot.waterRequirements,
        weedRequirements: plot.weedRequirements,
        fertilized: plot.fertilized,
        protectedUntil: plot.protectedUntil,
        status,
      });
    }

    // ========== [关键逻辑 3] 保存并响应 ==========

    // 保存所有更新（宠物收益、地块暂停状态等）
    await user.save();

    // 构建响应数据
    const responseData = {
      wallet_address: user.wallet_address,
      zeta: user.zeta,
      tickets: user.tickets,
      coins: user.coins,
      exp: user.exp,
      level: user.level,
      pet_list: user.pet_list,
      lastOfflineClaimAt: user.lastOfflineClaimAt,
      last_checkin_date: user.last_checkin_date,
      backpack: user.backpack,
      phrase_letters: user.phrase_letters,
      redeemed_rewards: user.redeemed_rewards,
      plots_list: plotsWithStatus, // 包含实时状态信息
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      
      // 额外的元数据
      _meta: {
        serverTime: now,
        offlineEarnings: earnedCoins,
        timestamp: new Date().toISOString(),
      },
    };

    console.log(
      `[GET /api/user/state] User ${user.wallet_address} state retrieved successfully ` +
      `(coins: ${user.coins}, level: ${user.level}, plots: ${user.plots_list.length})`
    );

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('[GET /api/user/state] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : '获取用户状态失败',
    });
  }
}

// 导出带认证的 handler
export default withAuth(handler);
