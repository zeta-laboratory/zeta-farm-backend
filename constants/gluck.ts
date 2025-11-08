/**
 * Gluck 抽奖奖励配置
 * 定义抽奖的概率表和奖励物品
 */

export interface GluckRewardItem {
  seedId: string;       // 种子 ID
  probability: number;  // 概率（0-1）
  minCount: number;     // 最小数量
  maxCount: number;     // 最大数量
}

/**
 * Gluck 抽奖奖池
 * 每次抽奖消耗 1 张奖券
 */
export const GLUCK_REWARDS: GluckRewardItem[] = [
  // 40% 概率获得低级种子（seed_0 或 seed_1）
  {
    seedId: 'seed_0',
    probability: 0.25,
    minCount: 3,
    maxCount: 5,
  },
  {
    seedId: 'seed_1',
    probability: 0.15,
    minCount: 2,
    maxCount: 4,
  },

  // 30% 概率获得中级种子（seed_2 或 seed_3）
  {
    seedId: 'seed_2',
    probability: 0.20,
    minCount: 2,
    maxCount: 3,
  },
  {
    seedId: 'seed_3',
    probability: 0.10,
    minCount: 1,
    maxCount: 2,
  },

  // 20% 概率获得高级种子（seed_4 或 seed_5）
  {
    seedId: 'seed_4',
    probability: 0.12,
    minCount: 1,
    maxCount: 2,
  },
  {
    seedId: 'seed_5',
    probability: 0.08,
    minCount: 1,
    maxCount: 1,
  },

  // 8% 概率获得稀有种子（seed_6 或 seed_7）
  {
    seedId: 'seed_6',
    probability: 0.05,
    minCount: 1,
    maxCount: 1,
  },
  {
    seedId: 'seed_7',
    probability: 0.03,
    minCount: 1,
    maxCount: 1,
  },

  // 2% 概率获得传奇种子（seed_8 或 seed_9）
  {
    seedId: 'seed_8',
    probability: 0.015,
    minCount: 1,
    maxCount: 1,
  },
  {
    seedId: 'seed_9',
    probability: 0.005,
    minCount: 1,
    maxCount: 1,
  },
];

/**
 * 抽奖结果接口
 */
export interface GluckResult {
  seedId: string;
  count: number;
}

/**
 * 执行 Gluck 抽奖
 * @param count - 抽奖次数（默认 1 次）
 * @returns 抽奖结果数组
 */
export function performGluck(count: number = 1): GluckResult[] {
  const results: GluckResult[] = [];

  for (let i = 0; i < count; i++) {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const reward of GLUCK_REWARDS) {
      cumulativeProbability += reward.probability;
      if (random <= cumulativeProbability) {
        const rewardCount = Math.floor(
          Math.random() * (reward.maxCount - reward.minCount + 1) + reward.minCount
        );
        results.push({
          seedId: reward.seedId,
          count: rewardCount,
        });
        break;
      }
    }
  }

  return results;
}

/**
 * 合并抽奖结果（将相同 seedId 的数量相加）
 */
export function mergeGluckResults(results: GluckResult[]): Record<string, number> {
  const merged: Record<string, number> = {};

  for (const result of results) {
    if (merged[result.seedId]) {
      merged[result.seedId] += result.count;
    } else {
      merged[result.seedId] = result.count;
    }
  }

  return merged;
}

/**
 * 单次抽奖所需奖券数量
 */
export const GLUCK_TICKET_COST = 1;

/**
 * 十连抽所需奖券数量（可以给折扣）
 */
export const GLUCK_TICKET_COST_10X = 10;
