# ZETA Farm Backend

Web3 农场游戏后端 API - 基于 Next.js + MongoDB + TypeScript 构建。

> 📖 **快速开始？** 查看 [QUICKSTART.md](./QUICKSTART.md) 5分钟快速部署指南
> 
> 🐳 **Docker 部署？** 查看 [DOCKER.md](./DOCKER.md) Docker 完整部署指南

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

### 4. 启动事件监听器（生产环境必需）

**开发环境：**
```bash
npm run listener
```

**生产环境（Docker - 推荐）：**
```bash
# 启动 API 和监听器
docker-compose up -d

# 查看日志
docker-compose logs -f listener
```

**生产环境（PM2）：**
```bash
# 安装 PM2
npm install -g pm2

# 启动监听器
pm2 start npm --name "zeta-farm-listener" -- run listener

# 查看日志
pm2 logs zeta-farm-listener

# 设置开机自启
pm2 startup
pm2 save
```

> 💡 **选择一种方式即可**：Docker 用户只需 `docker-compose up -d`，无需额外配置 PM2

### 部署方式对比

| 特性 | Docker Compose | PM2 | 开发环境 |
|------|---------------|-----|---------|
| **适用场景** | 容器化部署 | 传统服务器 | 本地开发 |
| **配置复杂度** | ⭐⭐ | ⭐⭐⭐ | ⭐ |
| **启动命令** | `docker-compose up -d` | `pm2 start ...` | `npm run listener` |
| **日志查看** | `docker-compose logs -f` | `pm2 logs` | 终端输出 |
| **自动重启** | ✅ | ✅ | ❌ |
| **多服务管理** | ✅ API + 监听器 | 需分别管理 | 需分别启动 |
| **推荐度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

> **推荐**: 使用 Docker Compose 进行生产环境部署，一次启动所有服务

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
│   ├── contract.ts     # 智能合约配置
│   └── index.ts        # 统一导出
├── lib/
│   └── mongodb.ts      # MongoDB 连接管理
├── models/
│   └── User.ts         # Mongoose 用户模型
├── middleware/
│   └── withAuth.ts     # 认证中间件
├── pages/api/
│   ├── actions/
│   │   └── request-action-voucher.ts  # 动作签名 API
│   └── user/
│       └── state.ts    # 核心游戏状态 API
├── scripts/
│   ├── listener.ts     # 事件监听器脚本
│   └── listener.service # Systemd 服务配置
├── types/
│   └── api.ts          # TypeScript 类型定义
└── utils/
    ├── gameLogic.ts    # 游戏核心逻辑
    ├── actionValidation.ts  # 动作验证逻辑
    ├── eventHandlers.ts # 事件处理逻辑
    └── blockchain.ts   # 区块链交互工具
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

### ✅ 阶段 4: "批准" API（用于合约交互）
- [x] 智能合约配置和 ABI
- [x] 区块链交互工具（viem）
- [x] 游戏动作验证逻辑
- [x] POST /api/actions/request-action-voucher
  - [x] 验证种植/收获/浇水/除草/施肥/铲除/抽奖操作
  - [x] 获取用户 nonce
  - [x] 生成 EIP-712 签名
  - [x] 返回签名凭证

### ✅ 阶段 5: "事件监听器"（更新数据库）
- [x] 事件处理逻辑（7 种操作）
- [x] 合约事件监听脚本
- [x] 自动更新用户状态
  - [x] plant - 扣除种子，更新地块
  - [x] harvest - 增加果实、经验、字母
  - [x] water - 标记浇水需求完成
  - [x] weed - 标记除草需求完成
  - [x] fertilize - 扣除肥料，缩短生长时间
  - [x] shovel - 清空地块
  - [x] gluck_draw - 扣除奖券，发放奖励
- [x] 后台服务部署配置

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

### POST /api/actions/request-action-voucher

请求动作签名凭证（用于链上操作）。

**请求头：**
```
Authorization: <wallet_address>
```

**请求体：**
```json
{
  "actionType": "plant",
  "data": {
    "plotId": 2,
    "seedId": "seed_0"
  }
}
```

**支持的 actionType：**
- `plant` - 种植作物
- `harvest` - 收获作物
- `water` - 浇水
- `weed` - 除草
- `fertilize` - 施肥
- `shovel` - 铲除作物
- `gluck_draw` - Gluck 抽奖

**响应示例：**
```json
{
  "signature": "0x1234...",
  "nonce": "5",
  "actionType": "plant",
  "data": "2",
  "user": "0x..."
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

### 阶段 6: 商店与经济 API（计划中）
- [ ] POST /api/shop/buy - 购买物品
- [ ] POST /api/shop/sell - 出售果实

### 阶段 6: 特殊功能（计划中）
- [ ] POST /api/checkin - 每日签到
- [ ] POST /api/lottery/draw - Gluck 抽奖
- [ ] - [ ] POST /api/exchange - 金币兑换 ZETA

## 🔐 环境变量配置

创建 `.env.local` 文件并配置以下变量：

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# 区块链
CHAIN_ID=7001
RPC_URL=https://zetachain-athens-evm.blockpi.network/v1/rpc/public

# 智能合约
FARM_TREASURY_ADDRESS=0x...

# 后端签名钱包
SIGNER_PRIVATE_KEY=0x...
```

## 🎯 工作流程

### 链上操作流程

1. **前端请求签名**：
   ```typescript
   const response = await fetch('/api/actions/request-action-voucher', {
     method: 'POST',
     headers: { Authorization: walletAddress },
     body: JSON.stringify({ actionType: 'plant', data: { plotId: 0, seedId: 'seed_0' } })
   });
   const { signature, nonce, data } = await response.json();
   ```

2. **前端调用合约**：
   ```typescript
   await farmTreasury.recordActionWithSignature(
     'plant',
     data,
     nonce,
     signature,
     { value: parseEther('0.1') } // 0.1 ZETA 税
   );
   ```

3. **前端更新后端状态**（阶段 5 - 已通过事件监听器自动完成）：
   ```typescript
   // 不再需要手动调用，事件监听器会自动更新数据库
   ```

4. **前端刷新状态**：
   ```typescript
   const stateResponse = await fetch('/api/user/state', {
     headers: { Authorization: walletAddress },
   });
   const newState = await stateResponse.json();
   ```

## 🔄 事件监听器

### 工作原理

事件监听器作为后台服务运行，实时监听区块链上的合约事件：

```
区块链事件 → 监听器接收 → 解析事件数据 → 更新 MongoDB → 完成
```

### 支持的事件处理

| 事件类型 | 数据库操作 |
|---------|-----------|
| `plant` | 扣除种子，更新地块状态，生成浇水/除草需求 |
| `harvest` | 增加果实、经验、字母，清空地块，升级 |
| `water` | 标记浇水需求完成，自动解封地块 |
| `weed` | 标记除草需求完成，自动解封地块 |
| `fertilize` | 扣除肥料，缩短 20% 生长时间 |
| `shovel` | 清空地块所有状态 |
| `gluck_draw` | 扣除奖券，执行抽奖，发放奖励 |

### 运行监听器

```bash
# 开发环境
npm run listener

# 生产环境（PM2）
pm2 start npm --name zeta-farm-listener -- run listener
pm2 logs zeta-farm-listener

# 查看日志示例
========================================
📥 New Event Received
Block: 12345678
TX: 0xabc...
User: 0x123...
Action: plant
Data: 65536
Timestamp: 1704715200
========================================

✅ Event processed successfully for plant
```

## 📊 数据库 Schema

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**技术栈:**
- Next.js 16 (Pages Router)
- TypeScript 5
- MongoDB + Mongoose
- Viem (区块链交互)
- Node.js 20+
- ZetaChain Testnet
