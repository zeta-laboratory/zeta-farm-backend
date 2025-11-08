/**
 * 宠物配置
 * 每个宠物的属性和离线收益
 */

export interface PetConfig {
  name: string;
  price: number;         // 购买价格（金币）
  coinsPerHour: number;  // 每小时产生的金币（离线收益）
}

export const PETS: Record<string, PetConfig> = {
  cat: {
    name: '小猫',
    price: 500,
    coinsPerHour: 50,
  },

  dog: {
    name: '小狗',
    price: 1000,
    coinsPerHour: 120,
  },

  rabbit: {
    name: '小兔子',
    price: 1500,
    coinsPerHour: 200,
  },

  pig: {
    name: '小猪',
    price: 2500,
    coinsPerHour: 350,
  },

  cow: {
    name: '奶牛',
    price: 4000,
    coinsPerHour: 600,
  },

  dragon: {
    name: '小龙',
    price: 8000,
    coinsPerHour: 1200,
  },
};

/**
 * 获取宠物配置
 */
export function getPetConfig(petId: string): PetConfig | null {
  return PETS[petId] || null;
}

/**
 * 计算宠物离线收益
 * @param petList - 用户拥有的宠物列表
 * @param lastClaimTime - 上次领取时间（Date 对象）
 * @param maxHours - 最大累积小时数（默认 24 小时）
 */
export function calculateOfflineEarnings(
  petList: string[],
  lastClaimTime: Date,
  maxHours: number = 24
): number {
  if (petList.length === 0) return 0;

  const now = new Date();
  const elapsedMs = now.getTime() - lastClaimTime.getTime();
  const elapsedHours = Math.min(elapsedMs / (1000 * 60 * 60), maxHours);

  // 计算所有宠物的总收益率
  const totalCoinsPerHour = petList.reduce((sum, petId) => {
    const pet = PETS[petId];
    return sum + (pet?.coinsPerHour || 0);
  }, 0);

  return Math.floor(totalCoinsPerHour * elapsedHours);
}

/**
 * 获取所有宠物的总收益率（每小时）
 */
export function getTotalCoinsPerHour(petList: string[]): number {
  return petList.reduce((sum, petId) => {
    const pet = PETS[petId];
    return sum + (pet?.coinsPerHour || 0);
  }, 0);
}
