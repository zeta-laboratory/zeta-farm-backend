/**
 * 种子配置
 * 每个种子的属性和生长周期
 */

export interface SeedConfig {
  name: string;
  cost: number;           // 购买成本（金币）
  price: number;          // 果实售价（金币）
  exp: number;            // 收获后获得的经验值
  stages: [number, number, number]; // [发芽, 生长, 成熟] 阶段时长（秒）
  witherTime: number;     // 成熟后多久开始枯萎（秒）
  waterReqs: number;      // 需要浇水次数
  weedReqs: number;       // 需要除草次数
}

export const SEEDS: Record<string, SeedConfig> = {
  // 等级 1 - 基础作物
  seed_0: {
    name: '小麦',
    cost: 10,
    price: 25,
    exp: 5,
    stages: [30, 60, 90],        // 总共 3 分钟
    witherTime: 180,              // 成熟后 3 分钟枯萎
    waterReqs: 1,
    weedReqs: 1,
  },
  
  seed_1: {
    name: '胡萝卜',
    cost: 20,
    price: 50,
    exp: 8,
    stages: [60, 120, 180],       // 总共 6 分钟
    witherTime: 300,              // 成熟后 5 分钟枯萎
    waterReqs: 2,
    weedReqs: 1,
  },

  // 等级 3 - 中级作物
  seed_2: {
    name: '玉米',
    cost: 50,
    price: 120,
    exp: 15,
    stages: [180, 300, 420],      // 总共 15 分钟
    witherTime: 600,              // 成熟后 10 分钟枯萎
    waterReqs: 2,
    weedReqs: 2,
  },

  seed_3: {
    name: '番茄',
    cost: 80,
    price: 200,
    exp: 25,
    stages: [300, 600, 900],      // 总共 30 分钟
    witherTime: 900,              // 成熟后 15 分钟枯萎
    waterReqs: 3,
    weedReqs: 2,
  },

  // 等级 5 - 高级作物
  seed_4: {
    name: '西瓜',
    cost: 150,
    price: 400,
    exp: 40,
    stages: [600, 1200, 1800],    // 总共 1 小时
    witherTime: 1800,             // 成熟后 30 分钟枯萎
    waterReqs: 3,
    weedReqs: 3,
  },

  seed_5: {
    name: '草莓',
    cost: 250,
    price: 700,
    exp: 60,
    stages: [900, 1800, 2700],    // 总共 1.5 小时
    witherTime: 3600,             // 成熟后 1 小时枯萎
    waterReqs: 4,
    weedReqs: 3,
  },

  // 等级 8 - 稀有作物
  seed_6: {
    name: '南瓜',
    cost: 400,
    price: 1100,
    exp: 90,
    stages: [1800, 3600, 5400],   // 总共 3 小时
    witherTime: 7200,             // 成熟后 2 小时枯萎
    waterReqs: 4,
    weedReqs: 4,
  },

  seed_7: {
    name: '葡萄',
    cost: 600,
    price: 1700,
    exp: 130,
    stages: [3600, 7200, 10800],  // 总共 6 小时
    witherTime: 10800,            // 成熟后 3 小时枯萎
    waterReqs: 5,
    weedReqs: 4,
  },

  // 等级 12 - 传奇作物
  seed_8: {
    name: '龙果',
    cost: 1000,
    price: 3000,
    exp: 200,
    stages: [7200, 14400, 21600], // 总共 12 小时
    witherTime: 21600,            // 成熟后 6 小时枯萎
    waterReqs: 6,
    weedReqs: 5,
  },

  seed_9: {
    name: '黄金玉米',
    cost: 1500,
    price: 5000,
    exp: 300,
    stages: [14400, 28800, 43200], // 总共 24 小时
    witherTime: 43200,             // 成熟后 12 小时枯萎
    waterReqs: 7,
    weedReqs: 6,
  },
};

/**
 * 获取种子配置
 */
export function getSeedConfig(seedId: string): SeedConfig | null {
  return SEEDS[seedId] || null;
}

/**
 * 计算总生长时间（秒）
 */
export function getTotalGrowTime(seedId: string): number {
  const seed = SEEDS[seedId];
  if (!seed) return 0;
  return seed.stages.reduce((sum, stage) => sum + stage, 0);
}

/**
 * 获取当前生长阶段 (0=发芽, 1=生长, 2=成熟, 3=枯萎, -1=尚未种植)
 */
export function getGrowthStage(
  seedId: string,
  plantedAt: number,
  pausedDuration: number = 0,
  fertilized: boolean = false
): number {
  const seed = SEEDS[seedId];
  if (!seed) return -1;

  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - plantedAt - pausedDuration;

  // 肥料效果：缩短 20% 生长时间
  const fertilizerBonus = fertilized ? 0.8 : 1;
  const stages = seed.stages.map(s => Math.floor(s * fertilizerBonus));
  
  const stage0End = stages[0];
  const stage1End = stages[0] + stages[1];
  const stage2End = stages[0] + stages[1] + stages[2];
  const witherStart = stage2End + seed.witherTime;

  if (elapsed < stage0End) return 0;
  if (elapsed < stage1End) return 1;
  if (elapsed < stage2End) return 2;
  if (elapsed < witherStart) return 2; // 成熟但未枯萎
  return 3; // 枯萎
}
