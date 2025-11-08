/**
 * 每日签到奖励配置
 * 定义签到的概率和奖励范围
 */

export interface CheckinReward {
  probability: number;  // 概率（0-1）
  minCoins: number;     // 最小金币奖励
  maxCoins: number;     // 最大金币奖励
}

export const CHECKIN_REWARDS: CheckinReward[] = [
  // 50% 概率获得 50-100 金币
  {
    probability: 0.5,
    minCoins: 50,
    maxCoins: 100,
  },

  // 30% 概率获得 100-200 金币
  {
    probability: 0.3,
    minCoins: 100,
    maxCoins: 200,
  },

  // 15% 概率获得 200-400 金币
  {
    probability: 0.15,
    minCoins: 200,
    maxCoins: 400,
  },

  // 5% 概率获得 400-800 金币
  {
    probability: 0.05,
    minCoins: 400,
    maxCoins: 800,
  },
];

/**
 * 执行每日签到，根据概率随机奖励
 * @returns 获得的金币数量
 */
export function performDailyCheckin(): number {
  const random = Math.random();
  let cumulativeProbability = 0;

  for (const reward of CHECKIN_REWARDS) {
    cumulativeProbability += reward.probability;
    if (random <= cumulativeProbability) {
      // 在范围内随机
      return Math.floor(
        Math.random() * (reward.maxCoins - reward.minCoins + 1) + reward.minCoins
      );
    }
  }

  // 兜底：返回最低奖励
  return CHECKIN_REWARDS[0].minCoins;
}

/**
 * 检查今天是否已签到
 * @param lastCheckinDate - 上次签到日期字符串（格式：YYYY-MM-DD）
 * @returns 是否已签到
 */
export function hasCheckedInToday(lastCheckinDate: string | null): boolean {
  if (!lastCheckinDate) return false;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return lastCheckinDate === today;
}

/**
 * 获取今天的日期字符串
 * @returns YYYY-MM-DD 格式的日期
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
