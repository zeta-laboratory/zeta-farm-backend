import mongoose, { Schema, Document, Model } from 'mongoose';

// 地块对象的接口
export interface IPlot {
  plot_index: number;
  unlocked: boolean;
  seedId: string | null;
  plantedAt: number | null;
  pausedDuration: number;
  pausedAt: number | null;
  waterRequirements: Array<{ time: number; done: boolean }>;
  weedRequirements: Array<{ time: number; done: boolean }>;
  fertilized: boolean;
  protectedUntil: number | null;
}

// 用户文档接口
export interface IUser extends Document {
  wallet_address: string;
  zeta: string;
  tickets: number;
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

// 地块子 Schema
const PlotSchema = new Schema<IPlot>(
  {
    plot_index: {
      type: Number,
      required: true,
    },
    unlocked: {
      type: Boolean,
      default: false,
    },
    seedId: {
      type: String,
      default: null,
    },
    plantedAt: {
      type: Number,
      default: null,
    },
    pausedDuration: {
      type: Number,
      default: 0,
    },
    pausedAt: {
      type: Number,
      default: null,
    },
    waterRequirements: {
      type: [
        {
          time: { type: Number, required: true },
          done: { type: Boolean, required: true },
        },
      ],
      default: [],
    },
    weedRequirements: {
      type: [
        {
          time: { type: Number, required: true },
          done: { type: Boolean, required: true },
        },
      ],
      default: [],
    },
    fertilized: {
      type: Boolean,
      default: false,
    },
    protectedUntil: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

// 用户 Schema
const UserSchema = new Schema<IUser>(
  {
    wallet_address: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    zeta: {
      type: String,
      default: '0.00',
    },
    tickets: {
      type: Number,
      default: 0,
    },
    coins: {
      type: Number,
      default: 1000,
    },
    exp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    pet_list: {
      type: [String],
      default: [],
    },
    lastOfflineClaimAt: {
      type: Date,
      default: Date.now,
    },
    last_checkin_date: {
      type: String,
      default: null,
    },
    backpack: {
      type: Schema.Types.Mixed,
      default: {
        seed_0: 1, // 新用户赠送 1 个小麦种子（白萝卜）
      },
    },
    phrase_letters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    redeemed_rewards: {
      type: [String],
      default: [],
    },
    plots_list: {
      type: [PlotSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// **任务 4: 新用户创建时自动初始化 18 个地块**
UserSchema.pre('save', function (next) {
  // 只在新文档创建时初始化地块
  if (this.isNew && this.plots_list.length === 0) {
    this.plots_list = Array.from({ length: 18 }, (_, index) => ({
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
    }));
  }
  next();
});

// 静态方法：创建新用户（可选的辅助方法）
UserSchema.statics.createNewUser = async function (wallet_address: string) {
  const user = new this({
    wallet_address,
  });
  await user.save();
  return user;
};

// 导出模型
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
