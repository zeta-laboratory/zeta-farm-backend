# 游戏静态数据常量

本目录包含 ZETA Farm 游戏的所有静态配置数据和经济模型常量。

## 📁 文件结构

```
constants/
├── index.ts          # 统一导出文件
├── levels.ts         # 等级系统配置
├── seeds.ts          # 种子和作物配置
├── pets.ts           # 宠物配置
├── plots.ts          # 地块解锁配置
├── checkin.ts        # 签到奖励配置
├── gluck.ts          # Gluck 抽奖配置
├── fertilizer.ts     # 肥料效果配置
└── test-example.ts   # 使用示例
```

## 📚 数据说明

### 1. 等级系统 (`levels.ts`)

```typescript
import { LEVELS, getLevel, getExpForNextLevel } from '@/constants';

// 获取当前等级
const level = getLevel(500); // 根据经验值 500 返回等级

// 获取下一等级所需经验
const nextLevelExp = getExpForNextLevel(5); // Level 5 升到 Level 6 所需经验
```

**配置内容:**
- 20 个等级的经验值阈值
- 等级计算工具函数

---

### 2. 种子配置 (`seeds.ts`)

```typescript
import { SEEDS, getSeedConfig, getGrowthStage } from '@/constants';

// 获取种子配置
const wheat = getSeedConfig('seed_0');
console.log(wheat.name); // "小麦"
console.log(wheat.cost); // 10 金币

// 计算当前生长阶段
const stage = getGrowthStage('seed_0', plantedAt, pausedDuration, fertilized);
// 返回: 0=发芽, 1=生长, 2=成熟, 3=枯萎
```

**配置内容:**
- 10 种作物（seed_0 到 seed_9）
- 每种作物的购买成本、售价、经验值
- 三阶段生长时间（发芽、生长、成熟）
- 枯萎时间、浇水/除草需求

---

### 3. 宠物配置 (`pets.ts`)

```typescript
import { PETS, calculateOfflineEarnings } from '@/constants';

// 获取宠物配置
const cat = PETS['cat'];
console.log(cat.coinsPerHour); // 50 金币/小时

// 计算离线收益
const earnings = calculateOfflineEarnings(
  ['cat', 'dog'],           // 宠物列表
  lastClaimTime,            // 上次领取时间
  24                        // 最大累积小时数
);
```

**配置内容:**
- 6 种宠物（cat, dog, rabbit, pig, cow, dragon）
- 每种宠物的购买价格和每小时金币收益
- 离线收益计算工具

---

### 4. 地块解锁 (`plots.ts`)

```typescript
import { PLOT_PRICES, canUnlockPlot } from '@/constants';

// 检查是否可以解锁地块
const result = canUnlockPlot(
  5,          // 地块索引
  1000,       // 用户金币
  6           // 用户等级
);

if (result.canUnlock) {
  console.log('可以解锁！');
} else {
  console.log('无法解锁:', result.reason);
}
```

**配置内容:**
- 18 个地块的解锁成本和等级要求
- 地块 0 默认免费解锁
- 成本从 0 到 18000 金币递增

---

### 5. 签到奖励 (`checkin.ts`)

```typescript
import { performDailyCheckin, hasCheckedInToday } from '@/constants';

// 检查今天是否已签到
if (!hasCheckedInToday(user.last_checkin_date)) {
  // 执行签到
  const coins = performDailyCheckin();
  console.log('获得金币:', coins);
}
```

**配置内容:**
- 4 档奖励概率（50%, 30%, 15%, 5%）
- 奖励范围：50-800 金币
- 签到状态检查工具

---

### 6. Gluck 抽奖 (`gluck.ts`)

```typescript
import { performGluck, mergeGluckResults, GLUCK_TICKET_COST } from '@/constants';

// 执行十连抽
const results = performGluck(10);

// 合并相同种子
const merged = mergeGluckResults(results);
console.log(merged); // { seed_0: 5, seed_2: 3, ... }
```

**配置内容:**
- 10 个种子的掉落概率
- 低级种子 40%，中级 30%，高级 20%，稀有 8%，传奇 2%
- 单次抽奖消耗 1 张奖券

---

### 7. 肥料效果 (`fertilizer.ts`)

```typescript
import { getAdjustedGrowTime, FERTILIZER_CONFIG } from '@/constants';

// 计算施肥后的生长时间
const originalTime = 180; // 3 分钟
const adjustedTime = getAdjustedGrowTime(originalTime, true);
console.log(adjustedTime); // 144 秒（缩短 20%）

// 肥料价格
console.log(FERTILIZER_CONFIG.price); // 50 金币
```

**配置内容:**
- 默认缩短 20% 生长时间
- 可为不同等级作物定义不同效果
- 肥料价格：50 金币

---

## 🔧 使用指南

### 在 API 中使用

```typescript
// pages/api/plot/plant.ts
import { SEEDS, getSeedConfig } from '@/constants';
import User from '@/models/User';

export default async function handler(req, res) {
  const { seedId } = req.body;
  
  // 获取种子配置
  const seed = getSeedConfig(seedId);
  if (!seed) {
    return res.status(400).json({ error: '无效的种子' });
  }
  
  // 检查用户金币是否足够
  if (user.coins < seed.cost) {
    return res.status(400).json({ error: '金币不足' });
  }
  
  // 扣除金币，种植作物
  user.coins -= seed.cost;
  await user.save();
  
  res.json({ success: true });
}
```

### 在工具函数中使用

```typescript
// utils/gameLogic.ts
import { getGrowthStage, SEEDS } from '@/constants';

export function checkHarvestReady(plot: IPlot): boolean {
  if (!plot.seedId || !plot.plantedAt) return false;
  
  const stage = getGrowthStage(
    plot.seedId,
    plot.plantedAt,
    plot.pausedDuration,
    plot.fertilized
  );
  
  return stage === 2; // 成熟可收获
}
```

---

## 📊 经济平衡

### 金币获取途径
1. **收获作物**: 根据作物等级获得 25-5000 金币
2. **宠物离线收益**: 每小时 50-1200 金币
3. **每日签到**: 每天 50-800 金币

### 金币消耗途径
1. **购买种子**: 10-1500 金币
2. **购买肥料**: 50 金币
3. **购买宠物**: 500-8000 金币
4. **解锁地块**: 0-18000 金币

### 升级路径
- **等级 1-5**: 快速升级期（700 经验）
- **等级 6-10**: 中期发展（2700 经验）
- **等级 11-20**: 后期挑战（10450 经验）

---

## 🧪 测试

运行测试示例：

```bash
npx tsx constants/test-example.ts
```

---

## 📝 更新日志

### 2025-01-08
- ✅ 创建所有静态数据常量
- ✅ 添加工具函数和类型定义
- ✅ 创建使用示例和文档
