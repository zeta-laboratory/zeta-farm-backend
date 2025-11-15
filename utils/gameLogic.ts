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
  PAUSED = 'paused',         // 暂停生长（因浇水/除草需求）
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
  // isReady 已移除 - 可通过 stage === PlotStage.RIPE 判断
}

/**
 * 计算地块的累计暂停时长
 * @param plot - 地块对象（会被修改）
 * @param now - 当前时间（Unix timestamp in seconds）
 * @returns 累计暂停秒数
 */
export function calculatePausedDuration(plot: IPlot, now: number): number {
  // Build pause intervals for all requirements, using absolute timestamps.
  // For completed reqs we use [reqStart, doneAt].
  // For uncompleted-but-triggered reqs we use [reqStart, now].
  // Then merge overlapping intervals to avoid double-counting.
  const intervals: Array<[number, number]> = [];
  const allReqs = [...plot.waterRequirements, ...plot.weedRequirements];

  for (const req of allReqs) {
    const reqStart = (plot.plantedAt || 0) + req.time;

    // If the requirement time hasn't been reached yet, it's not a pause.
    if (now < reqStart) continue;

    if (req.done && req.doneAt) {
      // Only add if doneAt is after start (defensive)
      if (req.doneAt > reqStart) intervals.push([reqStart, req.doneAt]);
    } else {
      // Uncompleted and triggered: open interval until now
      intervals.push([reqStart, now]);
    }
  }

  if (intervals.length === 0) {
    plot.pausedAt = null;
    plot.pausedDuration = 0;
    return 0;
  }

  // Sort intervals by start
  intervals.sort((a, b) => a[0] - b[0]);

  // Merge overlapping intervals
  const merged: Array<[number, number]> = [];
  let [curStart, curEnd] = intervals[0];
  for (let i = 1; i < intervals.length; i++) {
    const [s, e] = intervals[i];
    if (s <= curEnd) {
      // overlap — extend end
      curEnd = Math.max(curEnd, e);
    } else {
      merged.push([curStart, curEnd]);
      curStart = s;
      curEnd = e;
    }
  }
  merged.push([curStart, curEnd]);

  // Sum merged interval lengths
  let pausedDuration = merged.reduce((sum, [s, e]) => sum + (e - s), 0);

  // If there's an ongoing interval that ends at 'now', set pausedAt to its start
  const ongoing = merged.find(([s, e]) => e === now);
  plot.pausedAt = ongoing ? ongoing[0] : null;
  plot.pausedDuration = pausedDuration;
  return pausedDuration;
}

/**
 * 计算并更新地块的虫害状态
 * @param plot - 地块对象（会被修改）
 * @param now - 当前时间（Unix timestamp in seconds）
 * @param stage - 当前生长阶段
 */
export function calculatePests(plot: IPlot, now: number, stage: PlotStage): void {
  const PEST_PROBABILITY = 0.004; // 每秒0.4%概率

  // 只在 GROWING 和 RIPE 阶段检查虫害
  if (stage !== PlotStage.GROWING && stage !== PlotStage.RIPE) {
    return;
  }

  // 如果该作物在本次种植周期内已经出现过虫害，则不再重新生成（一次性事件）
  if (plot.pestsOccurred) {
    plot.lastPestCheckAt = now;
    return;
  }

  // 如果已经有虫害，不再重复触发
  if (plot.pests) {
    plot.lastPestCheckAt = now;
    return;
  }

  // 计算自上次检查以来的秒数
  const lastCheck = plot.lastPestCheckAt || plot.plantedAt || now;
  const deltaSeconds = Math.max(0, now - lastCheck);

  // 模拟每一秒的随机判定
  let hasPest = false;
  for (let i = 0; i < deltaSeconds; i++) {
    if (Math.random() < PEST_PROBABILITY) {
      hasPest = true;
      break;
    }
  }

  plot.pests = hasPest;
  if (hasPest) {
    // 标记该作物在本次种植周期内已发生虫害（除虫后不再复发）
    plot.pestsOccurred = true;
  }
  plot.lastPestCheckAt = now;

  if (hasPest) {
    console.log(`[calculatePests] Plot ${plot.plot_index} got pests!`);
  }
}

/**
 * 计算地块状态
 * @param plot - 地块对象
 * @param now - 当前时间（Unix timestamp in seconds）
 * @returns 地块状态
 */
/**
 * 计算地块状态
 * @param plot - 地块对象（会被修改，包括 matureAt, witheredAt, stage, pests 等）
 * @param now - 当前时间（Unix timestamp in seconds）
 * @returns 地块状态
 */
export function calculatePlotStatus(
  plot: IPlot,
  now: number
): PlotStatus {
  // 如果地块为空
  if (!plot.seedId || !plot.plantedAt) {
    plot.stage = PlotStage.EMPTY;
    plot.matureAt = null;
    plot.witheredAt = null;
    return {
      stage: PlotStage.EMPTY,
      needsWater: false,
      hasWeeds: false,
      hasPests: false,
      effectiveElapsedTime: 0,
      progress: 0,
    };
  }

  // 获取种子配置
  const seed = getSeedConfig(plot.seedId);
  if (!seed) {
    console.error(`[calculatePlotStatus] Invalid seedId: ${plot.seedId}`);
    plot.stage = PlotStage.EMPTY;
    plot.matureAt = null;
    plot.witheredAt = null;
    return {
      stage: PlotStage.EMPTY,
      needsWater: false,
      hasWeeds: false,
      hasPests: false,
      effectiveElapsedTime: 0,
      progress: 0,
    };
  }

  // 1. 计算累计暂停时长（会更新 plot.pausedDuration 和 plot.pausedAt）
  const pausedDuration = calculatePausedDuration(plot, now);

  // 2. 计算有效经过时间（实际生长时间）
  // 注意：使用 now 而不是 pausedAt，以便正确判断需求时间点
  const effectiveElapsedTime = now - plot.plantedAt - pausedDuration;

  // 3. 检查是否需要浇水/除草
  const needsWater = plot.waterRequirements.some(
    req => effectiveElapsedTime >= req.time && !req.done
  );
  const hasWeeds = plot.weedRequirements.some(
    req => effectiveElapsedTime >= req.time && !req.done
  );

  // 4. 计算生长阶段时间（考虑肥料效果）
  const fertilizerMultiplier = plot.fertilized ? 0.8 : 1;
  const stages = seed.stages.map(s => Math.floor(s * fertilizerMultiplier));
  
  const stage0End = stages[0];  // SEED 阶段结束时间点
  const stage1End = stages[1];  // SPROUT 阶段结束时间点
  const stage2End = stages[2];  // GROWING 阶段结束时间点（成熟时间）
  const witherStart = stage2End + seed.witherTime;

  // 5. 计算成熟时间和枯萎时间（绝对时间戳）
  // matureAt = plantedAt + stage2End + pausedDuration
  // witheredAt = plantedAt + witherStart + pausedDuration
  plot.matureAt = plot.plantedAt + stage2End + pausedDuration;
  plot.witheredAt = plot.plantedAt + witherStart + pausedDuration;

  // 6. 确定当前阶段
  let stage: PlotStage;
  let progress: number;

  if (needsWater || hasWeeds) {
    // 暂停状态优先
    stage = PlotStage.PAUSED;
    // 暂停时的进度保持在暂停前的状态
    if (effectiveElapsedTime < stage0End) {
      progress = (effectiveElapsedTime / stage0End) * 100;
    } else if (effectiveElapsedTime < stage1End) {
      progress = ((effectiveElapsedTime - stage0End) / (stage1End - stage0End)) * 100;
    } else if (effectiveElapsedTime < stage2End) {
      progress = ((effectiveElapsedTime - stage1End) / (stage2End - stage1End)) * 100;
    } else {
      progress = 100;
    }
  } else if (effectiveElapsedTime < 0) {
    stage = PlotStage.SEED;
    progress = 0;
  } else if (effectiveElapsedTime < stage0End) {
    stage = PlotStage.SEED;
    progress = (effectiveElapsedTime / stage0End) * 100;
  } else if (effectiveElapsedTime < stage1End) {
    stage = PlotStage.SPROUT;
    progress = ((effectiveElapsedTime - stage0End) / (stage1End - stage0End)) * 100;
  } else if (effectiveElapsedTime < stage2End) {
    stage = PlotStage.GROWING;
    progress = ((effectiveElapsedTime - stage1End) / (stage2End - stage1End)) * 100;
  } else if (effectiveElapsedTime < witherStart) {
    stage = PlotStage.RIPE;
    progress = 100;
  } else {
    stage = PlotStage.WITHER;
    progress = 0;
  }

  // 7. 计算虫害（会更新 plot.pests 和 plot.lastPestCheckAt）
  calculatePests(plot, now, stage);

  // 8. 更新地块的 stage 字段
  plot.stage = stage;

  return {
    stage,
    needsWater,
    hasWeeds,
    hasPests: plot.pests,
    effectiveElapsedTime,
    progress: Math.min(100, Math.max(0, progress)),
  };
}

/**
 * 自动处理地块暂停/解封（已废弃，逻辑整合到 calculatePausedDuration）
 * @deprecated 使用 calculatePausedDuration 代替
 */
export function autoHandlePlotPause(
  plot: IPlot,
  status: PlotStatus,
  now: number
): void {
  // 此函数已被 calculatePausedDuration 取代
  // 保留此函数以兼容旧代码
  console.warn('[autoHandlePlotPause] This function is deprecated, use calculatePausedDuration instead');
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
 * @returns 需求时间点数组（包含 doneAt 字段）
 */
export function generatePlotRequirements(
  seedId: string,
  plantedAt: number,
  fertilized: boolean
): { 
  waterReqs: Array<{ time: number; done: boolean; doneAt: number | null }>; 
  weedReqs: Array<{ time: number; done: boolean; doneAt: number | null }> 
} {
  const seed = getSeedConfig(seedId);
  if (!seed) {
    return { waterReqs: [], weedReqs: [] };
  }

  // 计算总生长时间
  // 注意：stages[2] 就是总成熟时间，不是累加
  const fertilizerMultiplier = fertilized ? 0.8 : 1;
  const totalGrowTime = seed.stages[2] * fertilizerMultiplier;

  // 生成浇水需求时间点（均匀分布）
  const waterReqs: Array<{ time: number; done: boolean; doneAt: number | null }> = [];
  if (seed.waterReqs > 0) {
    const waterInterval = totalGrowTime / (seed.waterReqs + 1);
    for (let i = 1; i <= seed.waterReqs; i++) {
      waterReqs.push({
        time: Math.floor(waterInterval * i),
        done: false,
        doneAt: null,
      });
    }
  }

  // 生成除草需求时间点（均匀分布）
  const weedReqs: Array<{ time: number; done: boolean; doneAt: number | null }> = [];
  if (seed.weedReqs > 0) {
    const weedInterval = totalGrowTime / (seed.weedReqs + 1);
    for (let i = 1; i <= seed.weedReqs; i++) {
      weedReqs.push({
        time: Math.floor(weedInterval * i),
        done: false,
        doneAt: null,
      });
    }
  }

  return { waterReqs, weedReqs };
}
