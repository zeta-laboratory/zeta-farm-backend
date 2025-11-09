/**
 * 游戏动作验证逻辑
 * 验证用户是否可以执行特定操作
 */

import { IUser } from '@/models/User';
import { calculatePlotStatus, PlotStage } from './gameLogic';
import { getSeedConfig } from '@/constants';

/**
 * 动作验证结果
 */
export interface ActionValidationResult {
  valid: boolean;
  error?: string;
  actionData?: bigint; // 打包后的数据
}

/**
 * 验证种植操作
 */
export function validatePlantAction(
  user: IUser,
  data: { plotId: number; seedId: string }
): ActionValidationResult {
  const { plotId, seedId } = data;

  // 1. 验证地块索引
  if (plotId < 0 || plotId >= user.plots_list.length) {
    return { valid: false, error: '无效的地块索引' };
  }

  const plot = user.plots_list[plotId];

  // 2. 验证地块是否已解锁
  if (!plot.unlocked) {
    return { valid: false, error: '地块未解锁' };
  }

  // 3. 验证地块是否为空
  if (plot.seedId !== null) {
    return { valid: false, error: '地块已种植作物' };
  }

  // 4. 验证种子是否有效
  const seed = getSeedConfig(seedId);
  if (!seed) {
    return { valid: false, error: '无效的种子 ID' };
  }

  // 5. 验证背包中是否有该种子
  const seedCount = user.backpack[seedId] || 0;
  if (seedCount <= 0) {
    return { valid: false, error: '背包中没有该种子' };
  }

  // 打包数据：plotId (低16位) + seedIndex (高16位)
  const seedIndex = parseInt(seedId.split('_')[1] || '0');
  const actionData = BigInt(plotId) | (BigInt(seedIndex) << 16n);

  return { valid: true, actionData };
}

/**
 * 验证收获操作
 */
export function validateHarvestAction(
  user: IUser,
  data: { plotId: number }
): ActionValidationResult {
  const { plotId } = data;

  // 1. 验证地块索引
  if (plotId < 0 || plotId >= user.plots_list.length) {
    return { valid: false, error: '无效的地块索引' };
  }

  const plot = user.plots_list[plotId];

  // 2. 验证地块是否有作物
  if (!plot.seedId || !plot.plantedAt) {
    return { valid: false, error: '地块没有作物' };
  }

  // 3. 计算地块状态
  const now = Math.floor(Date.now() / 1000);
  const status = calculatePlotStatus(plot, now);

  // 4. 验证作物是否成熟
  if (status.stage !== PlotStage.RIPE) {
    return { 
      valid: false, 
      error: `作物未成熟，当前阶段: ${status.stage}` 
    };
  }

  // 打包数据：只传递 plotId
  const actionData = BigInt(plotId);

  return { valid: true, actionData };
}

/**
 * 验证浇水操作
 */
export function validateWaterAction(
  user: IUser,
  data: { plotId: number }
): ActionValidationResult {
  const { plotId } = data;

  // 1. 验证地块索引
  if (plotId < 0 || plotId >= user.plots_list.length) {
    return { valid: false, error: '无效的地块索引' };
  }

  const plot = user.plots_list[plotId];

  // 2. 验证地块是否有作物
  if (!plot.seedId || !plot.plantedAt) {
    return { valid: false, error: '地块没有作物' };
  }

  // 3. 计算地块状态
  const now = Math.floor(Date.now() / 1000);
  const status = calculatePlotStatus(plot, now);

  // 4. 验证是否需要浇水
  if (!status.needsWater) {
    return { valid: false, error: '作物不需要浇水' };
  }

  const actionData = BigInt(plotId);
  return { valid: true, actionData };
}

/**
 * 验证除草操作
 */
export function validateWeedAction(
  user: IUser,
  data: { plotId: number }
): ActionValidationResult {
  const { plotId } = data;

  // 1. 验证地块索引
  if (plotId < 0 || plotId >= user.plots_list.length) {
    return { valid: false, error: '无效的地块索引' };
  }

  const plot = user.plots_list[plotId];

  // 2. 验证地块是否有作物
  if (!plot.seedId || !plot.plantedAt) {
    return { valid: false, error: '地块没有作物' };
  }

  // 3. 计算地块状态
  const now = Math.floor(Date.now() / 1000);
  const status = calculatePlotStatus(plot, now);

  // 4. 验证是否有杂草
  if (!status.hasWeeds) {
    return { valid: false, error: '作物没有杂草' };
  }

  const actionData = BigInt(plotId);
  return { valid: true, actionData };
}

/**
 * 验证施肥操作
 */
export function validateFertilizeAction(
  user: IUser,
  data: { plotId: number }
): ActionValidationResult {
  const { plotId } = data;

  // 1. 验证背包中是否有肥料
  const fertilizerCount = user.backpack['fertilizer'] || 0;
  if (fertilizerCount <= 0) {
    return { valid: false, error: '背包中没有肥料' };
  }

  // 2. 验证地块索引
  if (plotId < 0 || plotId >= user.plots_list.length) {
    return { valid: false, error: '无效的地块索引' };
  }

  const plot = user.plots_list[plotId];

  // 3. 验证地块是否有作物
  if (!plot.seedId || !plot.plantedAt) {
    return { valid: false, error: '地块没有作物' };
  }

  // 4. 验证是否已经施肥
  if (plot.fertilized) {
    return { valid: false, error: '该地块已经施肥' };
  }

  const actionData = BigInt(plotId);
  return { valid: true, actionData };
}

/**
 * 验证铲除操作（清空地块）
 */
export function validateShovelAction(
  user: IUser,
  data: { plotId: number }
): ActionValidationResult {
  const { plotId } = data;

  // 1. 验证地块索引
  if (plotId < 0 || plotId >= user.plots_list.length) {
    return { valid: false, error: '无效的地块索引' };
  }

  const plot = user.plots_list[plotId];

  // 2. 验证地块是否有作物
  if (!plot.seedId || !plot.plantedAt) {
    return { valid: false, error: '地块没有作物，无需铲除' };
  }

  const actionData = BigInt(plotId);
  return { valid: true, actionData };
}

/**
 * 验证 Gluck 抽奖操作
 */
export function validateGluckDrawAction(
  user: IUser,
  data: { count: number }
): ActionValidationResult {
  const { count } = data;

  // 1. 验证抽奖次数
  if (count <= 0 || count > 10) {
    return { valid: false, error: '抽奖次数必须在 1-10 之间' };
  }

  // 2. 验证奖券余额
  if (user.tickets < count) {
    return { 
      valid: false, 
      error: `奖券不足，需要 ${count} 张，当前 ${user.tickets} 张` 
    };
  }

  const actionData = BigInt(count);
  return { valid: true, actionData };
}

/**
 * 根据 actionType 调用对应的验证函数
 */
export function validateAction(
  user: IUser,
  actionType: string,
  data: any
): ActionValidationResult {
  switch (actionType) {
    case 'plant':
      return validatePlantAction(user, data);
    
    case 'harvest':
      return validateHarvestAction(user, data);
    
    case 'water':
      return validateWaterAction(user, data);
    
    case 'weed':
      return validateWeedAction(user, data);
    
    case 'fertilize':
      return validateFertilizeAction(user, data);
    
    case 'shovel':
      return validateShovelAction(user, data);
    
    case 'gluck_draw':
      return validateGluckDrawAction(user, data);
    
    default:
      return { valid: false, error: `未知的操作类型: ${actionType}` };
  }
}
