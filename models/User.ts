import { ObjectId, Collection } from 'mongodb';
import connectDB from '@/lib/mongodb';

// 地块需求接口
export interface IPlotRequirement {
  time: number;              // 相对生长时间点（秒）
  done: boolean;
  doneAt: number | null;     // 实际完成时间戳（UTC秒）
}

// 地块对象的接口
export interface IPlot {
  plot_index: number;
  unlocked: boolean;
  seedId: string | null;
  plantedAt: number | null;           // UTC 秒时间戳
  fertilized: boolean;
  pausedDuration: number;             // 累计暂停秒数
  pausedAt: number | null;            // 当前暂停开始时间（UTC秒）
  protectedUntil: number | null;      // 杀虫剂保护期限（UTC秒）
  
  // 需求数组（使用新接口）
  waterRequirements: IPlotRequirement[];
  weedRequirements: IPlotRequirement[];
  
  // 虫害状态（后端管理）
  pests: boolean;                     // 当前是否有虫害
  lastPestCheckAt: number | null;     // 上次虫害判定时间（UTC秒）
  
  // 计算缓存字段（用于前端展示）
  matureAt: number | null;            // 计算出的成熟时间（UTC秒）
  witheredAt: number | null;          // 枯萎时间（UTC秒）
  stage: string | null;               // 当前阶段：'seed'|'sprout'|'growing'|'ripe'|'wither'|'paused'|'empty'
}

// 用户文档接口
export interface IUser {
  _id?: ObjectId;
  wallet_address: string;
  zeta: string;
  tickets: number;
  processedExchangeNonces?: number[];
  coins: number;
  exp: number;
  level: number;
  pet_list: string[];
  lastOfflineClaimAt: Date;
  last_checkin_date: string | null;
  backpack: Record<string, number>;
  phrase_letters: Record<string, number>;
  redeemed_rewards: string[];
  plots_list: IPlot[];
  createdAt: Date;
  updatedAt: Date;
}

// 初始化 18 个地块
function initializePlots(): IPlot[] {
  return Array.from({ length: 18 }, (_, index) => ({
    plot_index: index,
    unlocked: index === 0, // 只有第一个地块默认解锁
    seedId: null,
    plantedAt: null,
    pausedDuration: 0,
    pausedAt: null,
    waterRequirements: [],
    weedRequirements: [],
    fertilized: false,
    protectedUntil: null,
    pests: false,
    lastPestCheckAt: null,
    matureAt: null,
    witheredAt: null,
    stage: 'empty',
  }));
}

// 获取 Users 集合
async function getUsersCollection(): Promise<Collection<IUser>> {
  const { db } = await connectDB();
  return db.collection<IUser>('users');
}

// User 操作类
class UserModel {
  // 创建索引
  static async createIndexes() {
    const collection = await getUsersCollection();
    await collection.createIndex({ wallet_address: 1 }, { unique: true });
  }

  // 查找用户
  static async findOne(query: Partial<IUser>) {
    const collection = await getUsersCollection();
    return collection.findOne(query);
  }

  // 根据钱包地址查找用户
  static async findByWalletAddress(wallet_address: string) {
    return this.findOne({ wallet_address: wallet_address.toLowerCase() });
  }

  // 创建新用户
  static async createNewUser(wallet_address: string): Promise<IUser & { _id: ObjectId }> {
    const collection = await getUsersCollection();
    const now = new Date();
    
    const newUser: Omit<IUser, '_id'> = {
      wallet_address: wallet_address.toLowerCase(),
      zeta: '0.00',
      processedExchangeNonces: [],
      tickets: 0,
      coins: 1000,
      exp: 0,
      level: 1,
      pet_list: [],
      lastOfflineClaimAt: now,
      last_checkin_date: null,
      backpack: {
        seed_0: 1,
      },
      phrase_letters: {},
      redeemed_rewards: [],
      plots_list: initializePlots(),
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newUser as IUser);
    return { ...newUser, _id: result.insertedId } as IUser & { _id: ObjectId };
  }

  // 更新用户
  static async updateOne(
    query: Partial<IUser>,
    update: any
  ) {
    const collection = await getUsersCollection();
    
    // 自动更新 updatedAt
    if (!update.$set) {
      update.$set = {};
    }
    update.$set.updatedAt = new Date();
    
    return collection.updateOne(query, update);
  }

  // 查找或创建用户
  static async findOneOrCreate(wallet_address: string): Promise<IUser> {
    let user = await this.findByWalletAddress(wallet_address);
    
    if (!user) {
      user = await this.createNewUser(wallet_address);
    }
    
    return user as IUser;
  }

  // 查找多个用户
  static async find(query: Partial<IUser> = {}) {
    const collection = await getUsersCollection();
    return collection.find(query).toArray();
  }

  // 删除用户
  static async deleteOne(query: Partial<IUser>) {
    const collection = await getUsersCollection();
    return collection.deleteOne(query);
  }
}

// 初始化索引（应用启动时调用一次）
UserModel.createIndexes().catch(console.error);

export default UserModel;

