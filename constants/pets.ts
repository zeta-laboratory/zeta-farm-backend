/**
 * 宠物配置
 * 每个宠物的属性和离线收益
 * 设计理念：90天静态回本
 */

export interface PetConfig {
  name: string;
  price: number;         // 购买价格（金币）
  coinsPerHour: number;  // 每小时产生的金币（离线收益）
}

export const PETS: Record<string, PetConfig> = {
  chick: {
    name: '小鸡',
    price: 100,
    coinsPerHour: 0.046296, // 约1.1111金币/日，90天回本
  },

  rabbit: {
    name: '兔子',
    price: 500,
    coinsPerHour: 0.231481, // 约5.5556金币/日，90天回本
  },

  dog: {
    name: '小狗',
    price: 2000,
    coinsPerHour: 0.925926, // 约22.2222金币/日，90天回本
  },

  fox: {
    name: '狐狸',
    price: 5000,
    coinsPerHour: 2.314815, // 约55.5556金币/日，90天回本
  },

  panda: {
    name: '熊猫',
    price: 10000,
    coinsPerHour: 4.62963, // 约111.1111金币/日，90天回本
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
