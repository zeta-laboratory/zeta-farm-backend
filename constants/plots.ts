/**
 * 地块解锁配置
 * 每个地块的解锁成本和等级要求
 */

export interface PlotPrice {
  unlockCost: number;  // 解锁所需金币
  levelReq: number;    // 解锁所需等级
}

export const PLOT_PRICES: PlotPrice[] = [
  // 地块 0 - 默认解锁
  { unlockCost: 0, levelReq: 1 },
  
  // 地块 1-2 - 早期扩展
  { unlockCost: 100, levelReq: 1 },
  { unlockCost: 150, levelReq: 2 },
  
  // 地块 3-5 - 初级农场
  { unlockCost: 250, levelReq: 3 },
  { unlockCost: 400, levelReq: 4 },
  { unlockCost: 600, levelReq: 5 },
  
  // 地块 6-8 - 中级农场
  { unlockCost: 900, levelReq: 6 },
  { unlockCost: 1300, levelReq: 7 },
  { unlockCost: 1800, levelReq: 8 },
  
  // 地块 9-11 - 高级农场
  { unlockCost: 2500, levelReq: 9 },
  { unlockCost: 3300, levelReq: 10 },
  { unlockCost: 4200, levelReq: 11 },
  
  // 地块 12-14 - 专家农场
  { unlockCost: 5500, levelReq: 12 },
  { unlockCost: 7000, levelReq: 13 },
  { unlockCost: 9000, levelReq: 14 },
  
  // 地块 15-17 - 大师农场
  { unlockCost: 11500, levelReq: 15 },
  { unlockCost: 14500, levelReq: 16 },
  { unlockCost: 18000, levelReq: 17 },
];

/**
 * 获取地块解锁配置
 */
export function getPlotPrice(plotIndex: number): PlotPrice | null {
  if (plotIndex < 0 || plotIndex >= PLOT_PRICES.length) {
    return null;
  }
  return PLOT_PRICES[plotIndex];
}

/**
 * 检查用户是否可以解锁某个地块
 */
export function canUnlockPlot(
  plotIndex: number,
  userCoins: number,
  userLevel: number
): { canUnlock: boolean; reason?: string } {
  const plotPrice = getPlotPrice(plotIndex);
  
  if (!plotPrice) {
    return { canUnlock: false, reason: '无效的地块索引' };
  }

  if (userLevel < plotPrice.levelReq) {
    return { 
      canUnlock: false, 
      reason: `需要等级 ${plotPrice.levelReq}，当前等级 ${userLevel}` 
    };
  }

  if (userCoins < plotPrice.unlockCost) {
    return { 
      canUnlock: false, 
      reason: `金币不足，需要 ${plotPrice.unlockCost}，当前 ${userCoins}` 
    };
  }

  return { canUnlock: true };
}

/**
 * 获取用户当前等级可以解锁的最大地块数量
 */
export function getMaxUnlockablePlots(userLevel: number): number {
  let count = 0;
  for (const plotPrice of PLOT_PRICES) {
    if (userLevel >= plotPrice.levelReq) {
      count++;
    } else {
      break;
    }
  }
  return count;
}
