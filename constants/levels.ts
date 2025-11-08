/**
 * 等级系统配置
 * 每个等级所需的累计经验值
 */
export const LEVELS = [
  0,      // Level 1: 0 exp
  100,    // Level 2: 100 exp
  250,    // Level 3: 250 exp
  450,    // Level 4: 450 exp
  700,    // Level 5: 700 exp
  1000,   // Level 6: 1000 exp
  1350,   // Level 7: 1350 exp
  1750,   // Level 8: 1750 exp
  2200,   // Level 9: 2200 exp
  2700,   // Level 10: 2700 exp
  3250,   // Level 11: 3250 exp
  3850,   // Level 12: 3850 exp
  4500,   // Level 13: 4500 exp
  5200,   // Level 14: 5200 exp
  5950,   // Level 15: 5950 exp
  6750,   // Level 16: 6750 exp
  7600,   // Level 17: 7600 exp
  8500,   // Level 18: 8500 exp
  9450,   // Level 19: 9450 exp
  10450,  // Level 20: 10450 exp
];

/**
 * 根据经验值计算等级
 */
export function getLevel(exp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (exp >= LEVELS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * 获取下一等级所需经验值
 */
export function getExpForNextLevel(currentLevel: number): number | null {
  if (currentLevel >= LEVELS.length) {
    return null; // 已达到最高等级
  }
  return LEVELS[currentLevel];
}
