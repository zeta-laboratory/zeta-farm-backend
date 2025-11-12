/**
 * 事件处理器
 * 处理来自 FarmTreasury 合约的 ActionRecorded 事件
 */

import { IUser } from '@/models/User';
import User from '@/models/User';
import { SEEDS, performGluck, mergeGluckResults } from '@/constants';
import { generatePlotRequirements } from './gameLogic';

/**
 * 解包 data 字段
 * plant 操作: plotId (低16位) + seedIndex (高16位)
 * buySeed/sellFruit: seedIndex/fruitIndex (低16位) + count (高16位)
 * 其他操作: plotId 或 count
 */
function unpackData(actionType: string, data: bigint): { 
  plotId?: number; 
  seedId?: string; 
  fruitId?: string;
  count?: number;
  seedIndex?: number;
  fruitIndex?: number;
} {
  if (actionType === 'plant') {
    const plotId = Number(data & 0xFFFFn);
    const seedIndex = Number(data >> 16n);
    const seedId = `seed_${seedIndex}`;
    return { plotId, seedId, seedIndex };
  } else if (actionType === 'buySeed') {
    const seedIndex = Number(data & 0xFFFFn);
    const count = Number(data >> 16n);
    const seedId = `seed_${seedIndex}`;
    return { seedId, seedIndex, count };
  } else if (actionType === 'sellFruit') {
    const fruitIndex = Number(data & 0xFFFFn);
    const count = Number(data >> 16n);
    const fruitId = `fruit_${fruitIndex}`;
    return { fruitId, fruitIndex, count };
  } else if (actionType === 'buyFertilizer') {
    return { count: Number(data) };
  } else if (actionType === 'gluck_draw' || actionType === 'draw') {
    return { count: Number(data) };
  } else {
    return { plotId: Number(data) };
  }
}

/**
 * 随机掉落字母
 * @param probability - 掉落概率 (0-1)
 * @returns 掉落的字母或 null
 */
function randomLetterDrop(probability: number = 0.1): string | null {
  const letters = ['Z', 'E', 'T', 'A'];
  if (Math.random() < probability) {
    return letters[Math.floor(Math.random() * letters.length)];
  }
  return null;
}

/**
 * 处理 plant 事件
 */
export async function handlePlantAction(
  user: IUser,
  plotId: number,
  seedId: string,
  timestamp: number
): Promise<void> {
  console.log(`[handlePlantAction] User ${user.wallet_address} planting ${seedId} on plot ${plotId}`);

  // 1. 扣除种子
  if (!user.backpack[seedId]) {
    user.backpack[seedId] = 0;
  }
  user.backpack[seedId]--;

  // 2. 更新地块状态
  const plot = user.plots_list[plotId];
  if (!plot) {
    throw new Error(`Plot ${plotId} not found`);
  }

  plot.seedId = seedId;
  plot.plantedAt = timestamp;
  plot.pausedDuration = 0;
  plot.pausedAt = null;
  plot.fertilized = false;
  plot.protectedUntil = null;
  plot.pests = false;
  plot.lastPestCheckAt = timestamp;
  plot.matureAt = null;
  plot.witheredAt = null;
  plot.stage = 'seed';

  // 3. 生成浇水/除草需求（包含 doneAt 字段）
  const { waterReqs, weedReqs } = generatePlotRequirements(seedId, timestamp, plot.fertilized);
  plot.waterRequirements = waterReqs;
  plot.weedRequirements = weedReqs;

  console.log(`[handlePlantAction] Plot ${plotId} updated: ${waterReqs.length} water, ${weedReqs.length} weed`);
}

/**
 * 处理 harvest 事件
 */
export async function handleHarvestAction(
  user: IUser,
  plotId: number,
  timestamp: number
): Promise<void> {
  console.log(`[handleHarvestAction] User ${user.wallet_address} harvesting plot ${plotId}`);

  const plot = user.plots_list[plotId];
  if (!plot || !plot.seedId) {
    throw new Error(`Plot ${plotId} has no crop to harvest`);
  }

  const seed = SEEDS[plot.seedId];
  if (!seed) {
    throw new Error(`Invalid seed: ${plot.seedId}`);
  }

  // 1. 增加经验值
  user.exp += seed.exp;

  // 2. 增加果实（对应的 fruit_X）
  const fruitId = `fruit_${plot.seedId.split('_')[1]}`;
  if (!user.backpack[fruitId]) {
    user.backpack[fruitId] = 0;
  }
  
  // 每次收获 1 个果实
  const fruitCount = 1;
  user.backpack[fruitId] += fruitCount;

  // 3. 随机掉落字母 (10% 概率)
  const letter = randomLetterDrop(0.1);
  if (letter) {
    if (!user.phrase_letters[letter]) {
      user.phrase_letters[letter] = 0;
    }
    user.phrase_letters[letter]++;
    console.log(`[handleHarvestAction] Letter dropped: ${letter}`);
  }

  // 4. 更新等级
  const newLevel = calculateLevel(user.exp);
  if (newLevel > user.level) {
    user.level = newLevel;
    console.log(`[handleHarvestAction] User leveled up to ${newLevel}!`);
  }

  // 5. 清空地块（重置所有字段）
  plot.seedId = null;
  plot.plantedAt = null;
  plot.pausedDuration = 0;
  plot.pausedAt = null;
  plot.waterRequirements = [];
  plot.weedRequirements = [];
  plot.fertilized = false;
  plot.protectedUntil = null;
  plot.pests = false;
  plot.lastPestCheckAt = null;
  plot.matureAt = null;
  plot.witheredAt = null;
  plot.stage = 'empty';

  console.log(`[handleHarvestAction] Gained ${seed.exp} exp, ${fruitCount}x ${fruitId}`);
}

/**
 * 处理 water 事件
 */
export async function handleWaterAction(
  user: IUser,
  plotId: number,
  timestamp: number
): Promise<void> {
  console.log(`[handleWaterAction] User ${user.wallet_address} watering plot ${plotId}`);

  const plot = user.plots_list[plotId];
  if (!plot || !plot.seedId) {
    throw new Error(`Plot ${plotId} has no crop to water`);
  }

  // 找到第一个未完成的浇水需求并标记为完成
  const pendingWater = plot.waterRequirements.find(req => !req.done);
  if (pendingWater) {
    pendingWater.done = true;
    pendingWater.doneAt = timestamp; // 记录完成时间
    console.log(`[handleWaterAction] Water requirement completed at time ${pendingWater.time}, doneAt ${timestamp}`);
  } else {
    console.warn(`[handleWaterAction] No pending water requirements for plot ${plotId}`);
  }
}

/**
 * 处理 weed 事件
 */
export async function handleWeedAction(
  user: IUser,
  plotId: number,
  timestamp: number
): Promise<void> {
  console.log(`[handleWeedAction] User ${user.wallet_address} weeding plot ${plotId}`);

  const plot = user.plots_list[plotId];
  if (!plot || !plot.seedId) {
    throw new Error(`Plot ${plotId} has no crop to weed`);
  }

  // 找到第一个未完成的除草需求并标记为完成
  const pendingWeed = plot.weedRequirements.find(req => !req.done);
  if (pendingWeed) {
    pendingWeed.done = true;
    pendingWeed.doneAt = timestamp; // 记录完成时间
    console.log(`[handleWeedAction] Weed requirement completed at time ${pendingWeed.time}, doneAt ${timestamp}`);
  } else {
    console.warn(`[handleWeedAction] No pending weed requirements for plot ${plotId}`);
  }
}

/**
 * 处理 fertilize 事件
 */
export async function handleFertilizeAction(
  user: IUser,
  plotId: number,
  timestamp: number
): Promise<void> {
  console.log(`[handleFertilizeAction] User ${user.wallet_address} fertilizing plot ${plotId}`);

  // 1. 扣除肥料
  if (!user.backpack['fertilizer']) {
    user.backpack['fertilizer'] = 0;
  }
  user.backpack['fertilizer']--;

  // 2. 标记地块已施肥
  const plot = user.plots_list[plotId];
  if (!plot || !plot.seedId) {
    throw new Error(`Plot ${plotId} has no crop to fertilize`);
  }

  plot.fertilized = true;

  // 3. 重新生成浇水/除草需求（基于缩短后的时间）
  if (plot.plantedAt) {
    const { waterReqs, weedReqs } = generatePlotRequirements(
      plot.seedId,
      plot.plantedAt,
      true // fertilized = true
    );
    plot.waterRequirements = waterReqs;
    plot.weedRequirements = weedReqs;
  }

  console.log(`[handleFertilizeAction] Plot ${plotId} fertilized, growth time reduced by 20%`);
}

/**
 * 处理 pesticide 事件（杀虫剂）
 */
export async function handlePesticideAction(
  user: IUser,
  plotId: number,
  timestamp: number
): Promise<void> {
  console.log(`[handlePesticideAction] User ${user.wallet_address} applying pesticide to plot ${plotId}`);

  const plot = user.plots_list[plotId];
  if (!plot || !plot.seedId) {
    throw new Error(`Plot ${plotId} has no crop to apply pesticide`);
  }

  // 清除当前虫害
  plot.pests = false;
  plot.lastPestCheckAt = timestamp;

  console.log(`[handlePesticideAction] Plot ${plotId} pests removed`);
}

/**
 * 处理 protect 事件（保护期）
 */
export async function handleProtectAction(
  user: IUser,
  plotId: number,
  timestamp: number
): Promise<void> {
  console.log(`[handleProtectAction] User ${user.wallet_address} protecting plot ${plotId}`);

  const plot = user.plots_list[plotId];
  if (!plot || !plot.seedId) {
    throw new Error(`Plot ${plotId} has no crop to protect`);
  }

  // 设置24小时保护期（仅记录时间戳，不影响虫害逻辑）
  const PROTECT_DURATION = 24 * 60 * 60; // 24小时
  plot.protectedUntil = timestamp + PROTECT_DURATION;

  console.log(`[handleProtectAction] Plot ${plotId} protected until ${plot.protectedUntil}`);
}

/**
 * 处理 shovel 事件
 */
export async function handleShovelAction(
  user: IUser,
  plotId: number,
  timestamp: number
): Promise<void> {
  console.log(`[handleShovelAction] User ${user.wallet_address} shoveling plot ${plotId}`);

  const plot = user.plots_list[plotId];
  if (!plot) {
    throw new Error(`Plot ${plotId} not found`);
  }

  // 清空地块（铲除作物，重置所有字段）
  plot.seedId = null;
  plot.plantedAt = null;
  plot.pausedDuration = 0;
  plot.pausedAt = null;
  plot.waterRequirements = [];
  plot.weedRequirements = [];
  plot.fertilized = false;
  plot.protectedUntil = null;
  plot.pests = false;
  plot.lastPestCheckAt = null;
  plot.matureAt = null;
  plot.witheredAt = null;
  plot.stage = 'empty';

  console.log(`[handleShovelAction] Plot ${plotId} cleared`);
}

/**
 * 处理 gluck_draw 事件
 */
export async function handleGluckDrawAction(
  user: IUser,
  count: number,
  timestamp: number
): Promise<void> {
  console.log(`[handleGluckDrawAction] User ${user.wallet_address} drawing ${count}x Gluck`);

  // 1. 扣除奖券
  user.tickets -= count;

  // 2. 执行抽奖
  const results = performGluck(count);
  const merged = mergeGluckResults(results);

  // 3. 增加奖励到背包
  for (const [seedId, amount] of Object.entries(merged)) {
    if (!user.backpack[seedId]) {
      user.backpack[seedId] = 0;
    }
    user.backpack[seedId] += amount;
    console.log(`[handleGluckDrawAction] Rewarded ${amount}x ${seedId}`);
  }

  console.log(`[handleGluckDrawAction] Total rewards: ${Object.keys(merged).length} seed types`);
}

/**
 * 处理 buySeed 事件
 */
export async function handleBuySeedAction(
  user: IUser,
  seedId: string,
  count: number,
  timestamp: number
): Promise<void> {
  console.log(`[handleBuySeedAction] User ${user.wallet_address} buying ${count}x ${seedId}`);

  const seed = SEEDS[seedId];
  if (!seed) {
    throw new Error(`Invalid seed: ${seedId}`);
  }

  // 1. 扣除金币 - 使用 cost (种子成本)，而不是 price (果实售价)
  const totalCost = seed.cost * count;
  user.coins -= totalCost;

  // 2. 增加种子到背包
  if (!user.backpack[seedId]) {
    user.backpack[seedId] = 0;
  }
  user.backpack[seedId] += count;

  console.log(`[handleBuySeedAction] Spent ${totalCost} coins, gained ${count}x ${seedId}`);
}

/**
 * 处理 buyFertilizer 事件
 */
export async function handleBuyFertilizerAction(
  user: IUser,
  count: number,
  timestamp: number
): Promise<void> {
  console.log(`[handleBuyFertilizerAction] User ${user.wallet_address} buying ${count}x fertilizer`);

  // 肥料价格
  const FERTILIZER_PRICE = 50;
  const totalCost = FERTILIZER_PRICE * count;

  // 1. 扣除金币
  user.coins -= totalCost;

  // 2. 增加肥料到背包
  if (!user.backpack['fertilizer']) {
    user.backpack['fertilizer'] = 0;
  }
  user.backpack['fertilizer'] += count;

  console.log(`[handleBuyFertilizerAction] Spent ${totalCost} coins, gained ${count}x fertilizer`);
}

/**
 * 处理 sellFruit 事件
 */
export async function handleSellFruitAction(
  user: IUser,
  fruitId: string,
  count: number,
  timestamp: number
): Promise<void> {
  console.log(`[handleSellFruitAction] User ${user.wallet_address} selling ${count}x ${fruitId}`);

  // 获取对应的种子配置
  const seedIndex = fruitId.split('_')[1];
  const seedId = `seed_${seedIndex}`;
  const seed = SEEDS[seedId];
  
  if (!seed) {
    throw new Error(`Invalid fruit: ${fruitId}`);
  }

  // 果实售价直接使用 seed.price（表格中的"售价"列）
  const fruitPrice = seed.price;
  const totalEarnings = fruitPrice * count;

  // 1. 扣除水果
  if (!user.backpack[fruitId]) {
    user.backpack[fruitId] = 0;
  }
  user.backpack[fruitId] -= count;

  // 2. 增加金币
  user.coins += totalEarnings;

  console.log(`[handleSellFruitAction] Sold ${count}x ${fruitId} for ${totalEarnings} coins`);
}

/**
 * 处理 unlockPlot 事件
 */
export async function handleUnlockPlotAction(
  user: IUser,
  plotId: number,
  timestamp: number
): Promise<void> {
  console.log(`[handleUnlockPlotAction] User ${user.wallet_address} unlocking plot ${plotId}`);

  const plot = user.plots_list[plotId];
  if (!plot) {
    throw new Error(`Plot ${plotId} not found`);
  }

  // 解锁地块
  plot.unlocked = true;

  // 扣除金币（这里简化处理，实际应该从常量中获取解锁价格）
  const UNLOCK_COST = 100; // 临时硬编码
  user.coins -= UNLOCK_COST;

  console.log(`[handleUnlockPlotAction] Plot ${plotId} unlocked, spent ${UNLOCK_COST} coins`);
}

/**
 * 处理 checkin 事件
 */
export async function handleCheckinAction(
  user: IUser,
  timestamp: number
): Promise<void> {
  console.log(`[handleCheckinAction] User ${user.wallet_address} checking in`);

  // 签到奖励：金币和奖券
  const CHECKIN_COINS = 50;
  const CHECKIN_TICKETS = 1;

  user.coins += CHECKIN_COINS;
  user.tickets += CHECKIN_TICKETS;

  // 更新签到日期
  const today = new Date(timestamp * 1000).toISOString().split('T')[0];
  user.last_checkin_date = today;

  console.log(`[handleCheckinAction] Gained ${CHECKIN_COINS} coins and ${CHECKIN_TICKETS} ticket`);
}

/**
 * 计算等级（基于经验值）
 */
function calculateLevel(exp: number): number {
  const LEVELS = [
    0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700,
    3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450,
  ];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (exp >= LEVELS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * 主事件处理器
 */
export async function onActionRecorded(
  user: IUser,
  actionType: string,
  data: bigint,
  timestamp: number
): Promise<void> {
  const unpacked = unpackData(actionType, data);

  console.log(`[onActionRecorded] Processing ${actionType} event:`, unpacked);

  switch (actionType) {
    // 地块操作
    case 'plant':
      if (unpacked.plotId !== undefined && unpacked.seedId) {
        await handlePlantAction(user, unpacked.plotId, unpacked.seedId, timestamp);
      }
      break;

    case 'harvest':
      if (unpacked.plotId !== undefined) {
        await handleHarvestAction(user, unpacked.plotId, timestamp);
      }
      break;

    case 'water':
      if (unpacked.plotId !== undefined) {
        await handleWaterAction(user, unpacked.plotId, timestamp);
      }
      break;

    case 'weed':
      if (unpacked.plotId !== undefined) {
        await handleWeedAction(user, unpacked.plotId, timestamp);
      }
      break;

    case 'fertilize':
      if (unpacked.plotId !== undefined) {
        await handleFertilizeAction(user, unpacked.plotId, timestamp);
      }
      break;

    case 'shovel':
      if (unpacked.plotId !== undefined) {
        await handleShovelAction(user, unpacked.plotId, timestamp);
      }
      break;

    // 商店操作
    case 'buySeed':
      if (unpacked.seedId && unpacked.count !== undefined) {
        await handleBuySeedAction(user, unpacked.seedId, unpacked.count, timestamp);
      }
      break;

    case 'buyFertilizer':
      if (unpacked.count !== undefined) {
        await handleBuyFertilizerAction(user, unpacked.count, timestamp);
      }
      break;

    case 'sellFruit':
      if (unpacked.fruitId && unpacked.count !== undefined) {
        await handleSellFruitAction(user, unpacked.fruitId, unpacked.count, timestamp);
      }
      break;

    // 地块管理
    case 'unlockPlot':
      if (unpacked.plotId !== undefined) {
        await handleUnlockPlotAction(user, unpacked.plotId, timestamp);
      }
      break;

    // 签到和抽奖
    case 'checkin':
      await handleCheckinAction(user, timestamp);
      break;

    case 'draw':
    case 'gluck_draw':
      if (unpacked.count !== undefined) {
        await handleGluckDrawAction(user, unpacked.count, timestamp);
      }
      break;

    // 其他操作
    case 'pesticide':
      if (unpacked.plotId !== undefined) {
        await handlePesticideAction(user, unpacked.plotId, timestamp);
      }
      break;

    case 'protect':
      if (unpacked.plotId !== undefined) {
        await handleProtectAction(user, unpacked.plotId, timestamp);
      }
      break;

    case 'buyPet':
    case 'subscribeRobot':
    case 'exchange':
    case 'redeemReward':
      console.log(`[onActionRecorded] Action ${actionType} not yet implemented`);
      break;

    default:
      console.warn(`[onActionRecorded] Unknown actionType: ${actionType}`);
  }

  // 保存用户数据
  await User.updateOne(
    { wallet_address: user.wallet_address },
    {
      $set: {
        coins: user.coins,
        exp: user.exp,
        level: user.level,
        tickets: user.tickets,
        backpack: user.backpack,
        phrase_letters: user.phrase_letters,
        plots_list: user.plots_list,
        last_checkin_date: user.last_checkin_date,
      }
    }
  );
  console.log(`[onActionRecorded] User ${user.wallet_address} data saved successfully`);
}
