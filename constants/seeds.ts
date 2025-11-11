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
  // 等级 1 - 白萝卜
  seed_0: {
    name: '白萝卜',
    cost: 6,
    price: 12,
    exp: 3,
    stages: [25, 50, 75],         // 总共 75秒 (1.25分钟)
    witherTime: 60,               // 成熟后 60秒 枯萎
    waterReqs: 1,
    weedReqs: 0,
  },
  
  // 等级 2 - 草莓
  seed_1: {
    name: '草莓',
    cost: 8,
    price: 18,
    exp: 8,
    stages: [50, 100, 150],       // 总共 150秒 (2.5分钟)
    witherTime: 120,              // 成熟后 120秒 枯萎
    waterReqs: 1,
    weedReqs: 0,
  },

  // 等级 3 - 玉米
  seed_2: {
    name: '玉米',
    cost: 10,
    price: 25,
    exp: 13,
    stages: [100, 200, 300],      // 总共 300秒 (5分钟)
    witherTime: 180,              // 成熟后 180秒 枯萎
    waterReqs: 1,
    weedReqs: 0,
  },

  // 等级 4 - 葡萄
  seed_3: {
    name: '葡萄',
    cost: 18,
    price: 50,
    exp: 23,
    stages: [200, 400, 600],      // 总共 600秒 (10分钟)
    witherTime: 300,              // 成熟后 300秒 枯萎
    waterReqs: 1,
    weedReqs: 0,
  },

  // 等级 5 - 番茄
  seed_4: {
    name: '番茄',
    cost: 22,
    price: 70,
    exp: 28,
    stages: [400, 800, 1200],     // 总共 1200秒 (20分钟)
    witherTime: 480,              // 成熟后 480秒 枯萎
    waterReqs: 1,
    weedReqs: 1,
  },

  // 等级 6 - 蓝莓
  seed_5: {
    name: '蓝莓',
    cost: 30,
    price: 108,
    exp: 38,
    stages: [525, 1050, 1575],    // 总共 1575秒 (26.25分钟)
    witherTime: 600,              // 成熟后 600秒 枯萎
    waterReqs: 2,
    weedReqs: 1,
  },

  // 等级 7 - 南瓜
  seed_6: {
    name: '南瓜',
    cost: 42,
    price: 168,
    exp: 53,
    stages: [1050, 2100, 3150],   // 总共 3150秒 (52.5分钟)
    witherTime: 900,              // 成熟后 900秒 枯萎
    waterReqs: 2,
    weedReqs: 1,
  },

  // 等级 8 - 菠萝
  seed_7: {
    name: '菠萝',
    cost: 58,
    price: 255,
    exp: 73,
    stages: [2100, 4200, 6300],   // 总共 6300秒 (105分钟)
    witherTime: 1200,             // 成熟后 1200秒 枯萎
    waterReqs: 3,
    weedReqs: 1,
  },

  // 等级 9 - 咖啡豆
  seed_8: {
    name: '咖啡豆',
    cost: 80,
    price: 384,
    exp: 80,
    stages: [4200, 8400, 12600],  // 总共 12600秒 (210分钟)
    witherTime: 1800,             // 成熟后 1800秒 枯萎
    waterReqs: 3,
    weedReqs: 2,
  },

  // 等级 10 - 可可豆
  seed_9: {
    name: '可可豆',
    cost: 110,
    price: 583,
    exp: 110,
    stages: [7200, 14400, 21600], // 总共 21600秒 (360分钟)
    witherTime: 2400,             // 成熟后 2400秒 枯萎
    waterReqs: 4,
    weedReqs: 2,
  },

  // 等级 11 - 茶叶
  seed_10: {
    name: '茶叶',
    cost: 140,
    price: 812,
    exp: 140,
    stages: [10800, 21600, 32400], // 总共 32400秒 (540分钟)
    witherTime: 2700,              // 成熟后 2700秒 枯萎
    waterReqs: 5,
    weedReqs: 2,
  },

  // 等级 12 - 辣椒
  seed_11: {
    name: '辣椒',
    cost: 160,
    price: 1008,
    exp: 160,
    stages: [14400, 28800, 43200], // 总共 43200秒 (720分钟)
    witherTime: 3000,              // 成熟后 3000秒 枯萎
    waterReqs: 5,
    weedReqs: 2,
  },

  // 等级 13 - 水稻
  seed_12: {
    name: '水稻',
    cost: 190,
    price: 1292,
    exp: 190,
    stages: [21600, 43200, 64800], // 总共 64800秒 (1080分钟)
    witherTime: 3300,              // 成熟后 3300秒 枯萎
    waterReqs: 5,
    weedReqs: 3,
  },

  // 等级 14 - 小麦
  seed_13: {
    name: '小麦',
    cost: 220,
    price: 1628,
    exp: 220,
    stages: [24960, 49920, 74880], // 总共 74880秒 (1248分钟)
    witherTime: 3480,              // 成熟后 3480秒 枯萎
    waterReqs: 6,
    weedReqs: 3,
  },

  // 等级 15 - 桃子
  seed_14: {
    name: '桃子',
    cost: 260,
    price: 2054,
    exp: 260,
    stages: [28080, 56160, 112320], // 总共 112320秒 (1872分钟)
    witherTime: 3540,               // 成熟后 3540秒 枯萎
    waterReqs: 6,
    weedReqs: 4,
  },

  // 等级 16 - 梨子
  seed_15: {
    name: '梨子',
    cost: 300,
    price: 2520,
    exp: 300,
    stages: [56160, 112320, 168480], // 总共 168480秒 (2808分钟)
    witherTime: 3570,                // 成熟后 3570秒 枯萎
    waterReqs: 7,
    weedReqs: 4,
  },

  // 等级 17 - 芒果
  seed_16: {
    name: '芒果',
    cost: 360,
    price: 3132,
    exp: 360,
    stages: [72000, 144000, 216000], // 总共 216000秒 (3600分钟)
    witherTime: 3590,                // 成熟后 3590秒 枯萎
    waterReqs: 7,
    weedReqs: 5,
  },

  // 等级 18 - 樱桃
  seed_17: {
    name: '樱桃',
    cost: 420,
    price: 3780,
    exp: 420,
    stages: [108000, 216000, 324000], // 总共 324000秒 (5400分钟)
    witherTime: 3600,                 // 成熟后 3600秒 枯萎
    waterReqs: 8,
    weedReqs: 5,
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
 * 注意：stages[2] 就是总成熟时间
 */
export function getTotalGrowTime(seedId: string): number {
  const seed = SEEDS[seedId];
  if (!seed) return 0;
  return seed.stages[2]; // stages[2] 是成熟时间点，不是累加
}

/**
 * 获取当前生长阶段 (0=种子SEED, 1=发芽SPROUT, 2=生长GROWING, 3=成熟RIPE, 4=枯萎WITHER, -1=尚未种植)
 * 与前端保持一致: 0~s1=SEED(0), s1~s2=SPROUT(1), s2~s3=GROWING(2), s3~wither=RIPE(3), >wither=WITHER(4)
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
  
  // stages 是三个累计时间点，不是时长
  const stage0End = stages[0];  // SEED 结束点
  const stage1End = stages[1];  // SPROUT 结束点
  const stage2End = stages[2];  // GROWING 结束点 (成熟时间)
  const witherStart = stage2End + seed.witherTime;

  // 修复: 与前端保持一致的阶段划分
  if (elapsed < 0) return 0;           // SEED
  if (elapsed < stage0End) return 0;   // SEED (0~s1)
  if (elapsed < stage1End) return 1;   // SPROUT (s1~s2)
  if (elapsed < stage2End) return 2;   // GROWING (s2~s3)
  if (elapsed < witherStart) return 3; // RIPE (s3~wither)
  return 4;                            // WITHER (>wither)
}
