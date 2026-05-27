export const GRID_ROWS = 5
export const GRID_COLS = 9
export const CELL_W = 80
export const CELL_H = 100
export const GRID_OFFSET_X = 40
export const GRID_OFFSET_Y = 80
export const CANVAS_W = 900
export const CANVAS_H = 600
export const ZOMBIE_SPAWN_X = 820
export const LAWN_MOWER_X = 80

// ── Behavior Tag System ──
export type BehaviorTag =
  | 'shooter'       // 直线射手: fires projectiles in row
  | 'three_way'     // 三线射手: fires to 3 rows
  | 'lobber'        // 投掷: arc projectile over obstacles
  | 'piercing'      // 穿透: projectile passes through zombies
  | 'tracking'      // 追踪: auto-seeks nearest zombie
  | 'boomerang'     // 回旋镖: goes out and returns
  | 'cone_aoe'      // 锥形范围: damages area in front
  | 'chain_aoe'     // 闪电链: bounces to nearby zombies
  | 'radial_aoe'    // 周围AOE: damages 3x3 around self
  | 'bonk_choy'     // 近战快拳: rapid melee
  | 'sun_producer'  // 阳光: produces sun periodically
  | 'sun_producer_growing' // 阳光菇: grows over time
  | 'wall'          // 防御墙: high HP barrier
  | 'wall_regen'    // 再生墙: regenerates after destruction
  | 'wall_knockback'// 击退墙: bounces zombie back
  | 'mine'          // 地雷: arms then explodes on contact
  | 'spikeweed'     // 地刺: passive damage to walkers
  | 'water_trap'    // 水草: instant kill aquatic zombie
  | 'eater'         // 吞噬: swallow one zombie, digest
  | 'instant_3x3'   // 3x3爆炸: explode on placement
  | 'instant_row'   // 整行: burn entire row on placement
  | 'instant_freeze'// 全屏冻结: freeze all zombies
  | 'launcher'      // 导弹: targeted area explosion
  | 'magnet'        // 磁力: steal iron from zombies
  | 'light'         // 照明: reveal fog/invisible
  | 'avocado'       // 鳄梨: melee then charge
  | 'celery'        // 潜伏: backstab from behind
  | 'ghost_pepper'  // 幽灵辣椒: fear then explode
  | 'hot_date'      // 热辣海枣: attract then explode
  | 'spore'         // 孢子: killed zombie spawns new plant
  | 'pushback'      // 击退效果
  | 'slow'          // 减速效果
  | 'balloon_pop'   // 可击落气球僵尸
  | 'butter'        // 黄油: 概率眩晕
  | 'form_shift'    // 红针花: 根据列位置切换形态

// ── Plant Config ──
export interface PlantConfig {
  name: string
  cost: number
  cooldown: number
  hp: number
  maxHp?: number       // for regenerating walls
  damage: number
  attackInterval: number
  color: string
  rarity: 'common' | 'rare'
  tags: BehaviorTag[]
  emoji: string
  // Optional behavior modifiers
  projectileCount?: number   // multi-shot (repeater=2, gatling=4)
  splashRadius?: number      // 1=adjacent, 2=3x3
  slowAmount?: number        // speed multiplier (0.5 = half)
  pierces?: number           // count of zombies pierced
  pushback?: number          // pixel pushback
  stunChance?: number        // 0-1 chance to stun on hit
  stunDuration?: number      // seconds of stun
  aquatic?: boolean          // can plant on water rows
  sunAmount?: number         // per production cycle
  sunInterval?: number       // override attackInterval for sun production
  regenCount?: number        // wall_regen: regen times
  coneWidth?: number         // columns ahead for cone_aoe
  coneHeight?: number        // rows for cone_aoe
  chainCount?: number        // lightning chain bounces
  launcherRows?: number      // explosion radius for launchers
  growStages?: { time: number; sunAmount: number }[]  // for sun_producer_growing
}

export const PLANT_CONFIGS: Record<number, PlantConfig> = {
  // ═══════════════════════════════════════════
  // 普通植物 Common Plants (ID 1-30)
  // ═══════════════════════════════════════════

  1: {
    name: '豌豆射手', cost: 100, cooldown: 7.5, hp: 300, damage: 25,
    attackInterval: 1.2, color: '#4CAF50', rarity: 'common',
    tags: ['shooter'], emoji: '🌱',
  },
  2: {
    name: '向日葵', cost: 50, cooldown: 7.5, hp: 300, damage: 0,
    attackInterval: 24, color: '#FFEB3B', rarity: 'common',
    tags: ['sun_producer'], emoji: '🌻', sunAmount: 50,
  },
  3: {
    name: '坚果墙', cost: 50, cooldown: 30, hp: 4000, damage: 0,
    attackInterval: 0, color: '#8D6E63', rarity: 'common',
    tags: ['wall'], emoji: '🛡️', maxHp: 4000,
  },
  4: {
    name: '土豆雷', cost: 25, cooldown: 30, hp: 300, damage: 1800,
    attackInterval: 0, color: '#795548', rarity: 'common',
    tags: ['mine'], emoji: '🥔', splashRadius: 2,
  },
  5: {
    name: '卷心菜投手', cost: 100, cooldown: 7.5, hp: 300, damage: 30,
    attackInterval: 2.5, color: '#8BC34A', rarity: 'common',
    tags: ['lobber'], emoji: '🥬',
  },
  6: {
    name: '双发射手', cost: 200, cooldown: 7.5, hp: 300, damage: 25,
    attackInterval: 1.2, color: '#388E3C', rarity: 'common',
    tags: ['shooter'], emoji: '🔫', projectileCount: 2,
  },
  7: {
    name: '寒冰射手', cost: 150, cooldown: 7.5, hp: 300, damage: 20,
    attackInterval: 1.4, color: '#64B5F6', rarity: 'common',
    tags: ['shooter', 'slow'], emoji: '❄️', slowAmount: 0.5,
  },
  8: {
    name: '玉米投手', cost: 100, cooldown: 7.5, hp: 300, damage: 20,
    attackInterval: 2.5, color: '#FFC107', rarity: 'common',
    tags: ['lobber', 'butter'], emoji: '🌽', stunChance: 0.25, stunDuration: 4,
  },
  9: {
    name: '西瓜投手', cost: 325, cooldown: 7.5, hp: 300, damage: 60,
    attackInterval: 3.0, color: '#4CAF50', rarity: 'common',
    tags: ['lobber'], emoji: '🍉', splashRadius: 2,
  },
  10: {
    name: '回旋镖射手', cost: 175, cooldown: 7.5, hp: 300, damage: 20,
    attackInterval: 2.0, color: '#FF9800', rarity: 'common',
    tags: ['boomerang'], emoji: '🪃', pierces: 3,
  },
  11: {
    name: '闪电芦苇', cost: 125, cooldown: 7.5, hp: 300, damage: 15,
    attackInterval: 1.5, color: '#9C27B0', rarity: 'common',
    tags: ['chain_aoe'], emoji: '⚡', chainCount: 4,
  },
  12: {
    name: '大喷菇', cost: 125, cooldown: 7.5, hp: 300, damage: 18,
    attackInterval: 1.8, color: '#CE93D8', rarity: 'common',
    tags: ['piercing'], emoji: '🍄', pierces: 99, coneWidth: 4, coneHeight: 1,
  },
  13: {
    name: '阳光菇', cost: 25, cooldown: 7.5, hp: 300, damage: 0,
    attackInterval: 18, color: '#FFCC02', rarity: 'common',
    tags: ['sun_producer_growing'], emoji: '🍄',
    growStages: [
      { time: 0, sunAmount: 15 },
      { time: 60, sunAmount: 25 },
      { time: 120, sunAmount: 50 },
    ],
    sunAmount: 15,
  },
  14: {
    name: '路灯花', cost: 25, cooldown: 7.5, hp: 300, damage: 0,
    attackInterval: 0, color: '#FFEB3B', rarity: 'common',
    tags: ['light'], emoji: '💡',
  },
  15: {
    name: '磁力菇', cost: 100, cooldown: 7.5, hp: 300, damage: 0,
    attackInterval: 5.0, color: '#B0BEC5', rarity: 'common',
    tags: ['magnet'], emoji: '🧲',
  },
  16: {
    name: '仙人掌', cost: 125, cooldown: 7.5, hp: 300, damage: 25,
    attackInterval: 1.2, color: '#4CAF50', rarity: 'common',
    tags: ['shooter', 'balloon_pop'], emoji: '🌵',
  },
  17: {
    name: '缠绕水草', cost: 50, cooldown: 30, hp: 100, damage: 9999,
    attackInterval: 0, color: '#00796B', rarity: 'common',
    tags: ['water_trap'], emoji: '🌿', aquatic: true,
  },
  18: {
    name: '甜菜护卫', cost: 75, cooldown: 15, hp: 3000, damage: 0,
    attackInterval: 0, color: '#E91E63', rarity: 'common',
    tags: ['wall_knockback'], emoji: '🍠', maxHp: 3000, pushback: 60,
  },
  19: {
    name: '全息坚果', cost: 75, cooldown: 15, hp: 2000, damage: 0,
    attackInterval: 0, color: '#2196F3', rarity: 'common',
    tags: ['wall_regen'], emoji: '🔮', maxHp: 2000, regenCount: 1,
  },
  20: {
    name: '花生', cost: 150, cooldown: 20, hp: 4000, damage: 25,
    attackInterval: 1.5, color: '#A1887F', rarity: 'common',
    tags: ['wall', 'shooter'], emoji: '🥜', maxHp: 4000,
  },
  21: {
    name: '红针花', cost: 150, cooldown: 7.5, hp: 300, damage: 25,
    attackInterval: 1.2, color: '#F44336', rarity: 'common',
    tags: ['shooter', 'form_shift'], emoji: '🌺', projectileCount: 2,
  },
  22: {
    name: '原始向日葵', cost: 75, cooldown: 7.5, hp: 300, damage: 0,
    attackInterval: 20, color: '#FFEB3B', rarity: 'common',
    tags: ['sun_producer'], emoji: '🌻', sunAmount: 75,
  },
  23: {
    name: '双胞向日葵', cost: 125, cooldown: 7.5, hp: 300, damage: 0,
    attackInterval: 22, color: '#FFD600', rarity: 'common',
    tags: ['sun_producer'], emoji: '🌻', sunAmount: 100,
  },
  24: {
    name: '鳄梨', cost: 125, cooldown: 7.5, hp: 300, damage: 30,
    attackInterval: 1.0, color: '#558B2F', rarity: 'common',
    tags: ['avocado'], emoji: '🥑',
  },
  25: {
    name: '潜伏芹菜', cost: 50, cooldown: 15, hp: 300, damage: 100,
    attackInterval: 8.0, color: '#4CAF50', rarity: 'common',
    tags: ['celery'], emoji: '🥬',
  },
  26: {
    name: '抱抱菜', cost: 100, cooldown: 7.5, hp: 300, damage: 18,
    attackInterval: 1.6, color: '#8BC34A', rarity: 'common',
    tags: ['lobber', 'butter'], emoji: '🥊', stunChance: 0.15, stunDuration: 1.5,
  },
  27: {
    name: '孢子菇', cost: 150, cooldown: 7.5, hp: 300, damage: 25,
    attackInterval: 1.8, color: '#7B1FA2', rarity: 'common',
    tags: ['shooter', 'spore'], emoji: '🍄',
  },
  28: {
    name: '热辣海枣', cost: 175, cooldown: 20, hp: 2000, damage: 500,
    attackInterval: 0, color: '#FF5722', rarity: 'common',
    tags: ['hot_date'], emoji: '🌴', maxHp: 2000, splashRadius: 2,
  },
  29: {
    name: '幽灵辣椒', cost: 75, cooldown: 15, hp: 100, damage: 300,
    attackInterval: 0, color: '#E91E63', rarity: 'common',
    tags: ['ghost_pepper'], emoji: '👻', splashRadius: 2,
  },
  30: {
    name: '地刺', cost: 100, cooldown: 7.5, hp: 300, damage: 20,
    attackInterval: 0.5, color: '#B0BEC5', rarity: 'common',
    tags: ['spikeweed'], emoji: '🦔',
  },

  // ═══════════════════════════════════════════
  // 稀有植物 Rare Plants (ID 101-120)
  // ═══════════════════════════════════════════

  101: {
    name: '机枪射手', cost: 300, cooldown: 7.5, hp: 300, damage: 25,
    attackInterval: 0.3, color: '#1B5E20', rarity: 'rare',
    tags: ['shooter'], emoji: '🔫', projectileCount: 4,
  },
  102: {
    name: '火龙草', cost: 150, cooldown: 15, hp: 300, damage: 35,
    attackInterval: 1.5, color: '#FF5722', rarity: 'rare',
    tags: ['cone_aoe'], emoji: '🐉', coneWidth: 3, coneHeight: 1,
  },
  103: {
    name: '雷龙草', cost: 200, cooldown: 15, hp: 300, damage: 200,
    attackInterval: 6.0, color: '#FFEB3B', rarity: 'rare',
    tags: ['launcher'], emoji: '🐲', launcherRows: 0, stunDuration: 1.5,
  },
  104: {
    name: '冰西瓜投手', cost: 500, cooldown: 7.5, hp: 300, damage: 60,
    attackInterval: 3.0, color: '#64B5F6', rarity: 'rare',
    tags: ['lobber', 'slow'], emoji: '🍈', splashRadius: 2, slowAmount: 0.3,
  },
  105: {
    name: '樱桃炸弹', cost: 150, cooldown: 50, hp: 0, damage: 1800,
    attackInterval: 0, color: '#F44336', rarity: 'rare',
    tags: ['instant_3x3'], emoji: '💣',
  },
  106: {
    name: '火爆辣椒', cost: 125, cooldown: 50, hp: 0, damage: 9999,
    attackInterval: 0, color: '#FF5722', rarity: 'rare',
    tags: ['instant_row'], emoji: '🌶️',
  },
  107: {
    name: '寒冰菇', cost: 125, cooldown: 50, hp: 0, damage: 100,
    attackInterval: 0, color: '#64B5F6', rarity: 'rare',
    tags: ['instant_freeze'], emoji: '🍄', stunDuration: 5,
  },
  108: {
    name: '毁灭菇', cost: 125, cooldown: 60, hp: 0, damage: 3000,
    attackInterval: 0, color: '#424242', rarity: 'rare',
    tags: ['instant_3x3'], emoji: '💥', splashRadius: 4,
  },
  109: {
    name: '玉米加农炮', cost: 500, cooldown: 35, hp: 300, damage: 500,
    attackInterval: 22, color: '#FFC107', rarity: 'rare',
    tags: ['launcher'], emoji: '🌽', launcherRows: 3, splashRadius: 3,
  },
  110: {
    name: '椰子加农炮', cost: 400, cooldown: 20, hp: 300, damage: 400,
    attackInterval: 15, color: '#795548', rarity: 'rare',
    tags: ['launcher'], emoji: '🥥', launcherRows: 1, splashRadius: 2,
  },
  111: {
    name: '香蕉火箭炮', cost: 300, cooldown: 15, hp: 300, damage: 350,
    attackInterval: 10, color: '#FFEB3B', rarity: 'rare',
    tags: ['launcher'], emoji: '🍌', launcherRows: 0, splashRadius: 1,
  },
  112: {
    name: '香蒲', cost: 225, cooldown: 7.5, hp: 300, damage: 22,
    attackInterval: 1.0, color: '#E91E63', rarity: 'rare',
    tags: ['tracking', 'balloon_pop'], emoji: '🐱', aquatic: true,
  },
  113: {
    name: '忧郁蘑菇', cost: 150, cooldown: 15, hp: 300, damage: 25,
    attackInterval: 1.2, color: '#7B1FA2', rarity: 'rare',
    tags: ['radial_aoe'], emoji: '🍄',
  },
  114: {
    name: '地刺王', cost: 125, cooldown: 7.5, hp: 600, damage: 35,
    attackInterval: 0.4, color: '#B71C1C', rarity: 'rare',
    tags: ['spikeweed'], emoji: '🦔',
  },
  115: {
    name: '大嘴花', cost: 150, cooldown: 7.5, hp: 300, damage: 0,
    attackInterval: 42, color: '#7B1FA2', rarity: 'rare',
    tags: ['eater'], emoji: '👅',
  },
  116: {
    name: '三线射手', cost: 300, cooldown: 7.5, hp: 300, damage: 25,
    attackInterval: 1.2, color: '#4CAF50', rarity: 'rare',
    tags: ['shooter', 'three_way'], emoji: '🌿', projectileCount: 1,
  },
  117: {
    name: '激光豆', cost: 200, cooldown: 7.5, hp: 300, damage: 20,
    attackInterval: 1.6, color: '#00BCD4', rarity: 'rare',
    tags: ['piercing'], emoji: '🔦', pierces: 99,
  },
  118: {
    name: '导向蓟', cost: 250, cooldown: 7.5, hp: 300, damage: 28,
    attackInterval: 1.4, color: '#9C27B0', rarity: 'rare',
    tags: ['tracking'], emoji: '🌸',
  },
  119: {
    name: '橡木弓手', cost: 225, cooldown: 7.5, hp: 300, damage: 30,
    attackInterval: 1.8, color: '#795548', rarity: 'rare',
    tags: ['shooter'], emoji: '🏹',
  },
  120: {
    name: '原始豌豆射手', cost: 175, cooldown: 7.5, hp: 300, damage: 25,
    attackInterval: 1.4, color: '#8D6E63', rarity: 'rare',
    tags: ['shooter', 'pushback'], emoji: '🪨', pushback: 40,
  },
}

// ── Zombie Config ──
export interface ZombieConfig {
  name: string
  hp: number
  speed: number
  damage: number
  color: string
  hasPole?: boolean
  enragesAt?: number
  enrageSpeed?: number
  summons?: boolean
}

export const ZOMBIE_CONFIGS: Record<number, ZombieConfig> = {
  1: { name: '普通僵尸', hp: 200, speed: 22, damage: 100, color: '#9E9E9E' },
  2: { name: '路障僵尸', hp: 370, speed: 22, damage: 100, color: '#FF9800' },
  3: { name: '铁桶僵尸', hp: 1100, speed: 18, damage: 100, color: '#607D8B' },
  4: { name: '旗帜僵尸', hp: 200, speed: 22, damage: 100, color: '#E53935' },
  5: { name: '撑杆跳僵尸', hp: 333, speed: 40, damage: 100, color: '#8BC34A', hasPole: true },
  6: { name: '读报僵尸', hp: 430, speed: 16, damage: 100, color: '#9E9E9E', enragesAt: 200, enrageSpeed: 45 },
  7: { name: '橄榄球僵尸', hp: 1400, speed: 27, damage: 100, color: '#1565C0' },
  8: { name: '跳舞僵尸', hp: 333, speed: 15, damage: 100, color: '#E91E63', summons: true },
}

export const DEFAULT_LEVEL_CONFIG = {
  world: 1,
  level: 1,
  name: '白天 1-1',
  totalWaves: 10,
  allowedPlants: [1, 2],
  initialSun: 200,
  sunDropInterval: 10000,
  isNight: false,
  hasPool: false,
}

export const SUN_DROP_INTERVAL = 10000
export const SUN_LIFETIME = 8000
export const SUN_VALUE = 50
export const PEA_SPEED = 300
export const PEA_DAMAGE = 20
