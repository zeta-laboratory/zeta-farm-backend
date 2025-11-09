# ZETA Farm Backend

Web3 农场游戏后端 API - 基于 Next.js + MongoDB + TypeScript 构建。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 并填入你的 MongoDB 连接字符串：

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### 3. 启动开发服务器

```bash
npm run dev
```

服务器将在 [http://localhost:3000](http://localhost:3000) 启动。

## 📁 项目结构

```
zeta-farm-backend/
├── constants/           # 游戏静态数据配置
│   ├── levels.ts       # 等级系统
│   ├── seeds.ts        # 种子和作物
│   ├── pets.ts         # 宠物配置
│   ├── plots.ts        # 地块解锁
│   ├── checkin.ts      # 签到奖励
│   ├── gluck.ts        # Gluck 抽奖
│   ├── fertilizer.ts   # 肥料效果
│   └── index.ts        # 统一导出
├── lib/
│   └── mongodb.ts      # MongoDB 连接管理
├── models/
│   └── User.ts         # Mongoose 用户模型
├── middleware/
│   └── withAuth.ts     # 认证中间件
├── pages/api/
│   └── user/
│       └── state.ts    # 核心游戏状态 API
├── types/
│   └── api.ts          # TypeScript 类型定义
└── utils/
    └── gameLogic.ts    # 游戏核心逻辑
```

## 📚 核心功能

### ✅ 阶段 1: 项目设置与 MongoDB 模型
- [x] MongoDB 连接辅助函数
- [x] Mongoose User 模型（包含所有字段）
- [x] 地块子 Schema
- [x] 新用户自动初始化（18 个地块）

### ✅ 阶段 2: 静态游戏数据
- [x] 等级系统（20 个等级）
- [x] 种子配置（10 种作物）
- [x] 宠物配置（6 种宠物）
- [x] 地块解锁配置（18 个地块）
- [x] 签到奖励系统
- [x] Gluck 抽奖系统
- [x] 肥料效果配置

### ✅ 阶段 3: 核心 API（获取状态 + 结算）
- [x] withAuth 认证中间件
- [x] 游戏逻辑工具函数
- [x] GET /api/user/state API
  - [x] 宠物离线收益结算
  - [x] 地块状态实时计算
  - [x] 自动暂停/解封机制

## 🔌 API 文档

### GET /api/user/state

获取用户游戏状态（含自动结算）。

**请求头：**
```
Authorization: <wallet_address>
或
Authorization: Bearer <wallet_address>
```

**响应示例：**
```json
{
  "wallet_address": "0x...",
  "coins": 1000,
  "level": 1,
  "plots_list": [...],
  "_meta": {
    "serverTime": 1704715200,
    "offlineEarnings": 120
  }
}
```

详细文档请查看 [API_TEST.md](./API_TEST.md)。

## 🎮 游戏机制

### 宠物系统
- 宠物提供离线收益（每小时固定金币）
- 最多累积 24 小时收益
- 自动结算并更新 `lastOfflineClaimAt`

### 地块系统
- 18 个地块，第一个默认解锁
- 实时计算生长阶段（seed → sprout → growing → ripe → wither）
- 需要定期浇水/除草，否则自动暂停生长

### 经济系统
- 金币获取：收获、宠物、签到
- 金币消耗：种子、肥料、宠物、地块解锁
- ZETA 兑换：金币 → ZETA（链上验证）

## 🧪 测试

### TypeScript 类型检查
```bash
npm run build
```

### 测试 API
```bash
# 测试获取用户状态
curl -X GET http://localhost:3000/api/user/state \
  -H "Authorization: 0x1234567890abcdef1234567890abcdef12345678"
```

更多测试示例请查看 [API_TEST.md](./API_TEST.md)。

## 📊 数据库 Schema

### User Collection
```typescript
{
  wallet_address: string;      // 唯一，索引
  zeta: string;                // 高精度余额
  tickets: number;             // 奖券
  coins: number;               // 金币
  exp: number;                 // 经验值
  level: number;               // 等级
  pet_list: string[];          // 拥有的宠物
  lastOfflineClaimAt: Date;    // 上次领取时间
  last_checkin_date: string;   // 上次签到日期
  backpack: {};                // 背包物品
  phrase_letters: {};          // 字母收集
  redeemed_rewards: string[];  // 已兑换奖励
  plots_list: Plot[];          // 地块列表
}
```

详细 Schema 请查看 [models/User.ts](./models/User.ts)。

## 🔧 开发指南

### 添加新的 API 端点

1. 在 `pages/api/` 下创建新文件
2. 使用 `withAuth` 中间件保护路由
3. 从 `constants/` 导入游戏数据
4. 使用 `utils/gameLogic.ts` 中的工具函数

示例：
```typescript
import { withAuth } from '@/middleware/withAuth';
import { AuthenticatedRequest } from '@/types/api';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user;
  // 你的逻辑...
  await user.save();
  res.json({ success: true });
}

export default withAuth(handler);
```

## 📝 待办事项

### 阶段 4: 游戏操作 API（计划中）
- [ ] POST /api/plot/plant - 种植作物
- [ ] POST /api/plot/harvest - 收获作物
- [ ] POST /api/plot/water - 浇水
- [ ] POST /api/plot/weed - 除草
- [ ] POST /api/plot/unlock - 解锁地块

### 阶段 5: 商店 API（计划中）
- [ ] POST /api/shop/buy - 购买物品
- [ ] POST /api/shop/sell - 出售果实

### 阶段 6: 特殊功能（计划中）
- [ ] POST /api/checkin - 每日签到
- [ ] POST /api/lottery/draw - Gluck 抽奖
- [ ] POST /api/exchange - 金币兑换 ZETA

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**技术栈:**
- Next.js 16
- TypeScript 5
- MongoDB + Mongoose
- Node.js 20+
