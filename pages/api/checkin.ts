/**
 * POST /api/checkin
 * 
 * 每日签到
 * 
 * 响应:
 * {
 *   "success": true,
 *   "reward": 150,
 *   "totalCoins": 1150,
 *   "checkinDate": "2025-01-08"
 * }
 */

import { NextApiResponse } from 'next';
import { withAuth } from '@/middleware/withAuth';
import { AuthenticatedRequest } from '@/types/api';
import { performDailyCheckin, getTodayDateString, hasCheckedInToday } from '@/constants';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: '只支持 POST 请求',
    });
  }

  try {
    const user = req.user;
    const today = getTodayDateString();

    // 1. 检查今天是否已签到
    if (hasCheckedInToday(user.last_checkin_date)) {
      return res.status(400).json({
        error: 'Already checked in',
        message: '今天已经签到过了',
        checkinDate: user.last_checkin_date,
      });
    }

    // 2. 执行签到，获得随机奖励
    const reward = performDailyCheckin();

    // 3. 原子更新：增加金币，更新签到日期
    user.coins += reward;
    user.last_checkin_date = today;

    await user.save();

    console.log(
      `[POST /api/checkin] User ${user.wallet_address} checked in, reward: ${reward} coins`
    );

    return res.status(200).json({
      success: true,
      reward,
      totalCoins: user.coins,
      checkinDate: today,
      message: `签到成功！获得 ${reward} 金币`,
    });

  } catch (error) {
    console.error('[POST /api/checkin] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : '签到失败',
    });
  }
}

export default withAuth(handler);
