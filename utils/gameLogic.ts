/**
 * 游戏核心逻辑工具函数
 * 包含地块状态计算、宠物收益计算等
 */

import { IPlot } from '@/models/User';
import { PETS, SEEDS, getSeedConfig } from '@/constants';

/**
 * 地块状态枚举
 */
export enum PlotStage {
  EMPTY = 'empty',           // 空地块
  SEED = 'seed',             // 刚种植（种子阶段）
  SPROUT = 'sprout',         // 发芽
  GROWING = 'growing',       // 生长
  RIPE = 'ripe',             // 成熟（可收获）
  WITHER = 'wither',         // 枯萎
}

/**
 * 地块状态接口
 */
export interface PlotStatus {
  stage: PlotStage;
  needsWater: boolean;
  hasWeeds: boolean;
  hasPests: boolean;
  effectiveElapsedTime: number;
  progress: number;  // 当前阶段进度百分比 (0-100)
  isReady: boolean;  // 是否可以收获
}

/**
 * 计算地块状态
 * @param plot - 地块对象
 * @param now - 当前时间（Unix timestamp in seconds）
 * @returns 地块状态
 */
export function calculatePlotStatus(
  plot: IPlot,
  now: number
): PlotStatus {
  // 如果地块为空
  if (!plot.seedId || !plot.plantedAt) {
    return {
      stage: PlotStage.EMPTY,
      needsWater: false,
      hasWeeds: false,
      hasPests: false,
      effectiveElapsedTime: 0,
      progress: 0,
      isReady: false,
    };
  }

  // 获取种子配置
  const seed = getSeedConfig(plot.seedId);
  if (!seed) {
    console.error(`[calculatePlotStatus] Invalid seedId: ${plot.seedId}`);
    return {
      stage: PlotStage.EMPTY,
      needsWater: false,
      hasWeeds: false,
      hasPests: false,
      effectiveElapsedTime: 0,
      progress: 0,
      isReady: false,
    };
  }

  // 1. 计算有效经过时间
  const baseTime = plot.pausedAt !== null ? plot.pausedAt : now;
  const effectiveElapsedTime = baseTime - plot.plantedAt - plot.pausedDuration;

  // 2. 检查是否需要浇水/除草
  const needsWater = plot.waterRequirements.some(
    req => effectiveElapsedTime >= req.time && !req.done
  );
  const hasWeeds = plot.weedRequirements.some(
    req => effectiveElapsedTime >= req.time && !req.done
  );

  // 3. 虫害检查
  // 注意：虫害是客户端随机事件（0.4%概率），不影响生长速度
  // 后端不处理虫害逻辑，由前端管理
  // protectedUntil 字段预留给未来的杀虫剂功能
  const hasPests = false;

  // 4. 计算生长阶段时间（考虑肥料效果）
  // 注意：stages 是三个累计时间点，不是时长
  const fertilizerMultiplier = plot.fertilized ? 0.8 : 1;
  const stages = seed.stages.map(s => Math.floor(s * fertilizerMultiplier));
  
  const stage0End = stages[0];  // 第一个阶段的结束时间点
  const stage1End = stages[1];  // 第二个阶段的结束时间点
  const stage2End = stages[2];  // 第三个阶段的结束时间点（成熟时间）
  const witherStart = stage2End + seed.witherTime;

  // 5. 确定当前阶段
  let stage: PlotStage;
  let progress: number;
  let isReady: boolean;

  // 修复: 与前端保持一致 - 0~s1=SEED, s1~s2=SPROUT, s2~s3=GROWING
  if (effectiveElapsedTime < 0) {
    stage = PlotStage.SEED;
    progress = 0;
    isReady = false;
  } else if (effectiveElapsedTime < stage0End) {
    // 修复: 0~s1 应该是 SEED 阶段
    stage = PlotStage.SEED;
    progress = (effectiveElapsedTime / stage0End) * 100;
    isReady = false;
  } else if (effectiveElapsedTime < stage1End) {
    // 修复: s1~s2 应该是 SPROUT 阶段
    stage = PlotStage.SPROUT;
    progress = ((effectiveElapsedTime - stage0End) / (stage1End - stage0End)) * 100;
    isReady = false;
  } else if (effectiveElapsedTime < stage2End) {
    // s2~s3 是 GROWING 阶段
    stage = PlotStage.GROWING;
    progress = ((effectiveElapsedTime - stage1End) / (stage2End - stage1End)) * 100;
    isReady = false;
  } else if (effectiveElapsedTime < witherStart) {
    stage = PlotStage.RIPE;
    progress = 100;
    isReady = true;
  } else {
    stage = PlotStage.WITHER;
    progress = 0;
    isReady = false;
  }

  return {
    stage,
    needsWater,
    hasWeeds,
    hasPests,
    effectiveElapsedTime,
    progress: Math.min(100, Math.max(0, progress)),
    isReady,
  };
}

/**
 * 自动处理地块暂停/解封
 * @param plot - 地块对象（会被修改）
 * @param status - 地块状态
 * @param now - 当前时间（Unix timestamp in seconds）
 */
export function autoHandlePlotPause(
  plot: IPlot,
  status: PlotStatus,
  now: number
): void {
  const shouldBePaused = status.needsWater || status.hasWeeds;

  // 需要暂停但尚未暂停
  if (shouldBePaused && plot.pausedAt === null) {
    plot.pausedAt = now;
    console.log(`[autoHandlePlotPause] Plot ${plot.plot_index} paused at ${now}`);
  }

  // 不需要暂停但当前是暂停状态
  if (!shouldBePaused && plot.pausedAt !== null) {
    plot.pausedDuration += now - plot.pausedAt;
    plot.pausedAt = null;
    console.log(`[autoHandlePlotPause] Plot ${plot.plot_index} resumed, total paused: ${plot.pausedDuration}s`);
  }
}

/**
 * 计算宠物离线收益
 * @param petList - 用户拥有的宠物列表
 * @param lastClaimTime - 上次领取时间（Date 对象）
 * @param maxHours - 最大累积小时数（默认 24 小时）
 * @returns 离线收益金币数量
 */
export function calculatePetOfflineEarnings(
  petList: string[],
  lastClaimTime: Date,
  maxHours: number = 24
): number {
  if (petList.length === 0) {
    return 0;
  }

  // 计算离线时长（小时）
  const now = Date.now();
  const elapsedMs = now - lastClaimTime.getTime();
  const elapsedHours = Math.min(elapsedMs / (1000 * 60 * 60), maxHours);

  // 计算所有宠物的总收益率
  const totalCoinsPerHour = petList.reduce((sum, petId) => {
    const pet = PETS[petId];
    if (!pet) {
      console.warn(`[calculatePetOfflineEarnings] Unknown pet: ${petId}`);
      return sum;
    }
    return sum + pet.coinsPerHour;
  }, 0);

  // 计算总收益
  const earnedCoins = Math.floor(totalCoinsPerHour * elapsedHours);

  console.log(
    `[calculatePetOfflineEarnings] ${petList.length} pets, ` +
    `${elapsedHours.toFixed(2)}h offline, ` +
    `${totalCoinsPerHour} coins/h, earned ${earnedCoins} coins`
  );

  return earnedCoins;
}

/**
 * 生成地块的浇水/除草需求时间点
 * @param seedId - 种子 ID
 * @param plantedAt - 种植时间（Unix timestamp in seconds）
 * @param fertilized - 是否施肥
 * @returns 需求时间点数组
 */
export function generatePlotRequirements(
  seedId: string,
  plantedAt: number,
  fertilized: boolean
): { waterReqs: Array<{ time: number; done: boolean }>; weedReqs: Array<{ time: number; done: boolean }> } {
  const seed = getSeedConfig(seedId);
  if (!seed) {
    return { waterReqs: [], weedReqs: [] };
  }

  // 计算总生长时间
  // 注意：stages[2] 就是总成熟时间，不是累加
  const fertilizerMultiplier = fertilized ? 0.8 : 1;
  const totalGrowTime = seed.stages[2] * fertilizerMultiplier;

  // 生成浇水需求时间点（均匀分布）
  const waterReqs: Array<{ time: number; done: boolean }> = [];
  if (seed.waterReqs > 0) {
    const waterInterval = totalGrowTime / (seed.waterReqs + 1);
    for (let i = 1; i <= seed.waterReqs; i++) {
      waterReqs.push({
        time: Math.floor(waterInterval * i),
        done: false,
      });
    }
  }

  // 生成除草需求时间点（均匀分布）
  const weedReqs: Array<{ time: number; done: boolean }> = [];
  if (seed.weedReqs > 0) {
    const weedInterval = totalGrowTime / (seed.weedReqs + 1);
    for (let i = 1; i <= seed.weedReqs; i++) {
      weedReqs.push({
        time: Math.floor(weedInterval * i),
        done: false,
      });
    }
  }

  return { waterReqs, weedReqs };
}
