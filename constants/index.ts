/**
 * 游戏静态数据常量统一导出
 * 集中管理所有游戏配置和经济模型数据
 */

// 等级系统
export { LEVELS, getLevel, getExpForNextLevel } from './levels';

// 种子配置
export { 
  SEEDS, 
  getSeedConfig, 
  getTotalGrowTime, 
  getGrowthStage 
} from './seeds';
export type { SeedConfig } from './seeds';

// 宠物配置
export { 
  PETS, 
  getPetConfig, 
  calculateOfflineEarnings, 
  getTotalCoinsPerHour 
} from './pets';
export type { PetConfig } from './pets';

// 地块解锁
export { 
  PLOT_PRICES, 
  getPlotPrice, 
  canUnlockPlot, 
  getMaxUnlockablePlots 
} from './plots';
export type { PlotPrice } from './plots';

// 签到奖励
export { 
  CHECKIN_REWARDS, 
  performDailyCheckin, 
  hasCheckedInToday, 
  getTodayDateString 
} from './checkin';
export type { CheckinReward } from './checkin';

// Gluck 抽奖
export { 
  GLUCK_REWARDS, 
  GLUCK_TICKET_COST, 
  GLUCK_TICKET_COST_10X,
  performGluck, 
  mergeGluckResults 
} from './gluck';
export type { GluckRewardItem, GluckResult } from './gluck';

// 肥料效果
export { 
  FERTILIZER_EFFECT, 
  FERTILIZER_CONFIG,
  getFertilizerMultiplier, 
  getAdjustedGrowTime, 
  getRecommendedFertilizerEffect 
} from './fertilizer';
export type { FertilizerEffect } from './fertilizer';
