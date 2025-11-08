/**
 * 肥料效果配置
 * 定义肥料对不同等级作物的生长时间缩减百分比
 */

export interface FertilizerEffect {
  reductionPercent: number;  // 生长时间缩减百分比（0-1）
  description: string;       // 描述
}

/**
 * 肥料效果配置
 * 根据种子等级定义不同的效果
 */
export const FERTILIZER_EFFECT: Record<string, FertilizerEffect> = {
  // 所有作物统一效果
  default: {
    reductionPercent: 0.2,  // 缩减 20% 生长时间
    description: '缩短 20% 生长时间',
  },

  // 可选：为不同等级的种子定义不同效果
  low_tier: {
    reductionPercent: 0.15,  // 低级种子（seed_0, seed_1）缩减 15%
    description: '缩短 15% 生长时间',
  },

  mid_tier: {
    reductionPercent: 0.2,   // 中级种子（seed_2-5）缩减 20%
    description: '缩短 20% 生长时间',
  },

  high_tier: {
    reductionPercent: 0.25,  // 高级种子（seed_6-9）缩减 25%
    description: '缩短 25% 生长时间',
  },
};

/**
 * 肥料购买配置
 */
export const FERTILIZER_CONFIG = {
  price: 50,              // 每个肥料价格（金币）
  stackable: false,       // 是否可叠加（false = 每个地块只能用一次）
  applyBeforePlant: true, // 是否需要在种植前施肥
};

/**
 * 获取肥料效果
 * @param seedId - 种子 ID（可选，用于区分等级）
 * @returns 生长时间的乘数（例如 0.8 = 缩短 20%）
 */
export function getFertilizerMultiplier(seedId?: string): number {
  // 默认使用统一效果
  const effect = FERTILIZER_EFFECT.default;
  return 1 - effect.reductionPercent;
}

/**
 * 计算施肥后的生长时间
 * @param originalTime - 原始生长时间（秒）
 * @param fertilized - 是否施肥
 * @returns 实际生长时间（秒）
 */
export function getAdjustedGrowTime(
  originalTime: number,
  fertilized: boolean
): number {
  if (!fertilized) return originalTime;
  return Math.floor(originalTime * getFertilizerMultiplier());
}

/**
 * 根据种子等级获取推荐肥料效果
 * @param seedId - 种子 ID
 * @returns 肥料效果配置
 */
export function getRecommendedFertilizerEffect(seedId: string): FertilizerEffect {
  const seedIndex = parseInt(seedId.split('_')[1]);

  if (seedIndex <= 1) {
    return FERTILIZER_EFFECT.low_tier;
  } else if (seedIndex <= 5) {
    return FERTILIZER_EFFECT.mid_tier;
  } else {
    return FERTILIZER_EFFECT.high_tier;
  }
}
