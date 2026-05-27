import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  adapter: new (require('@prisma/adapter-libsql').PrismaLibSql)({ url: 'file:./dev.db' }),
})

const LEVELS = [
  { world: 1, levelNumber: 1, name: '白天 1-1', configJson: { totalWaves: 5, initialSun: 100, isNight: false, hasPool: false, waves: generateWaves(5, false), allowedPlants: [1,2,3,5], rewards: { coins: 30, gems: 1 } } },
  { world: 1, levelNumber: 2, name: '白天 1-2', configJson: { totalWaves: 6, initialSun: 100, isNight: false, hasPool: false, waves: generateWaves(6, false), allowedPlants: [1,2,3,5], rewards: { coins: 35, gems: 1 } } },
  { world: 1, levelNumber: 3, name: '白天 1-3', configJson: { totalWaves: 7, initialSun: 100, isNight: false, hasPool: false, waves: generateWaves(7, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 30, gems: 1 } } },
  { world: 1, levelNumber: 4, name: '白天 1-4', configJson: { totalWaves: 8, initialSun: 100, isNight: false, hasPool: false, waves: generateWaves(8, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 40, gems: 1 } } },
  { world: 1, levelNumber: 5, name: '白天 1-5', configJson: { totalWaves: 10, initialSun: 100, isNight: false, hasPool: false, waves: generateWaves(10, true), allowedPlants: [1,2,3,4,5], rewards: { coins: 40, gems: 2 } } },
  { world: 1, levelNumber: 6, name: '白天 1-6', configJson: { totalWaves: 10, initialSun: 75, isNight: false, hasPool: false, waves: generateWaves(10, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 45, gems: 1 } } },
  { world: 1, levelNumber: 7, name: '白天 1-7', configJson: { totalWaves: 12, initialSun: 75, isNight: false, hasPool: false, waves: generateWaves(12, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 45, gems: 1 } } },
  { world: 1, levelNumber: 8, name: '白天 1-8', configJson: { totalWaves: 12, initialSun: 75, isNight: false, hasPool: false, waves: generateWaves(12, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 50, gems: 2 } } },
  { world: 1, levelNumber: 9, name: '白天 1-9', configJson: { totalWaves: 14, initialSun: 50, isNight: false, hasPool: false, waves: generateWaves(14, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 50, gems: 2 } } },
  { world: 1, levelNumber: 10, name: '白天 1-10', configJson: { totalWaves: 20, initialSun: 50, isNight: false, hasPool: false, waves: generateWaves(20, true), allowedPlants: [1,2,3,4,5], rewards: { coins: 60, gems: 3 } } },
  { world: 2, levelNumber: 1, name: '夜晚 2-1', configJson: { totalWaves: 5, initialSun: 50, isNight: true, hasPool: false, waves: generateWaves(5, false), allowedPlants: [1,2,3], rewards: { coins: 30, gems: 1 } } },
  { world: 2, levelNumber: 2, name: '夜晚 2-2', configJson: { totalWaves: 6, initialSun: 50, isNight: true, hasPool: false, waves: generateWaves(6, false), allowedPlants: [1,2,3,5], rewards: { coins: 35, gems: 1 } } },
  { world: 2, levelNumber: 3, name: '夜晚 2-3', configJson: { totalWaves: 7, initialSun: 50, isNight: true, hasPool: false, waves: generateWaves(7, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 35, gems: 1 } } },
  { world: 2, levelNumber: 4, name: '夜晚 2-4', configJson: { totalWaves: 8, initialSun: 50, isNight: true, hasPool: false, waves: generateWaves(8, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 40, gems: 1 } } },
  { world: 2, levelNumber: 5, name: '夜晚 2-5', configJson: { totalWaves: 10, initialSun: 50, isNight: true, hasPool: false, waves: generateWaves(10, true), allowedPlants: [1,2,3,4,5], rewards: { coins: 40, gems: 2 } } },
  { world: 2, levelNumber: 6, name: '夜晚 2-6', configJson: { totalWaves: 10, initialSun: 25, isNight: true, hasPool: false, waves: generateWaves(10, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 45, gems: 1 } } },
  { world: 2, levelNumber: 7, name: '夜晚 2-7', configJson: { totalWaves: 12, initialSun: 25, isNight: true, hasPool: false, waves: generateWaves(12, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 45, gems: 1 } } },
  { world: 2, levelNumber: 8, name: '夜晚 2-8', configJson: { totalWaves: 12, initialSun: 25, isNight: true, hasPool: false, waves: generateWaves(12, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 50, gems: 2 } } },
  { world: 2, levelNumber: 9, name: '夜晚 2-9', configJson: { totalWaves: 14, initialSun: 25, isNight: true, hasPool: false, waves: generateWaves(14, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 50, gems: 2 } } },
  { world: 2, levelNumber: 10, name: '夜晚 2-10', configJson: { totalWaves: 20, initialSun: 25, isNight: true, hasPool: false, waves: generateWaves(20, true), allowedPlants: [1,2,3,4,5], rewards: { coins: 60, gems: 3 } } },
  { world: 3, levelNumber: 1, name: '泳池 3-1', configJson: { totalWaves: 5, initialSun: 100, isNight: false, hasPool: true, waves: generateWaves(5, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 30, gems: 1 } } },
  { world: 3, levelNumber: 2, name: '泳池 3-2', configJson: { totalWaves: 6, initialSun: 100, isNight: false, hasPool: true, waves: generateWaves(6, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 35, gems: 1 } } },
  { world: 3, levelNumber: 3, name: '泳池 3-3', configJson: { totalWaves: 7, initialSun: 100, isNight: false, hasPool: true, waves: generateWaves(7, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 35, gems: 1 } } },
  { world: 3, levelNumber: 4, name: '泳池 3-4', configJson: { totalWaves: 8, initialSun: 100, isNight: false, hasPool: true, waves: generateWaves(8, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 40, gems: 1 } } },
  { world: 3, levelNumber: 5, name: '泳池 3-5', configJson: { totalWaves: 10, initialSun: 100, isNight: false, hasPool: true, waves: generateWaves(10, true), allowedPlants: [1,2,3,4,5], rewards: { coins: 40, gems: 2 } } },
  { world: 3, levelNumber: 6, name: '泳池 3-6', configJson: { totalWaves: 10, initialSun: 75, isNight: false, hasPool: true, waves: generateWaves(10, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 45, gems: 1 } } },
  { world: 3, levelNumber: 7, name: '泳池 3-7', configJson: { totalWaves: 12, initialSun: 75, isNight: false, hasPool: true, waves: generateWaves(12, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 45, gems: 1 } } },
  { world: 3, levelNumber: 8, name: '泳池 3-8', configJson: { totalWaves: 12, initialSun: 75, isNight: false, hasPool: true, waves: generateWaves(12, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 50, gems: 2 } } },
  { world: 3, levelNumber: 9, name: '泳池 3-9', configJson: { totalWaves: 14, initialSun: 50, isNight: false, hasPool: true, waves: generateWaves(14, false), allowedPlants: [1,2,3,4,5], rewards: { coins: 50, gems: 2 } } },
  { world: 3, levelNumber: 10, name: '泳池 3-10', configJson: { totalWaves: 20, initialSun: 50, isNight: false, hasPool: true, waves: generateWaves(20, true), allowedPlants: [1,2,3,4,5], rewards: { coins: 60, gems: 3 } } },
]

function generateWaves(total: number, hasHuge: boolean): any[] {
  const waves: any[] = []
  for (let w = 0; w < total; w++) {
    const zombieTypes = w < 3 ? [1] : w < 6 ? [1, 2] : [1, 2, 3]
    const zombieCount = hasHuge && (w + 1) % 5 === 0 ? 10 : 3 + Math.floor(w * 0.8)
    const zombies = []
    for (let i = 0; i < zombieCount; i++) {
      zombies.push({
        type: zombieTypes[Math.floor(Math.random() * zombieTypes.length)],
        row: Math.floor(Math.random() * 5),
        count: 1,
        spawnInterval: Math.random() * 3,
      })
    }
    waves.push({ waveIndex: w + 1, delayBefore: w === 0 ? 0 : 20 + Math.random() * 15, zombies })
  }
  return waves
}

async function main() {
  console.log('Seeding database...')

  const existingLevels = await prisma.level.count()
  if (existingLevels > 0) {
    console.log('Levels already exist, skipping level seed')
  } else {
    for (const level of LEVELS) {
      await prisma.level.create({
        data: {
          ...level,
          configJson: JSON.stringify(level.configJson),
        },
      })
    }
    console.log(`Seeded ${LEVELS.length} levels`)
  }

  // Seed rare plant shop items
  const existingItems = await prisma.item.count()
  if (existingItems > 0) {
    console.log('Items already exist, skipping item seed')
  } else {
    const rarePlants = [
      { name: '机枪射手', type: 'plant', priceCoins: 300, priceGems: 0, effectJson: '101' },
      { name: '火龙草', type: 'plant', priceCoins: 150, priceGems: 0, effectJson: '102' },
      { name: '雷龙草', type: 'plant', priceCoins: 200, priceGems: 0, effectJson: '103' },
      { name: '冰西瓜投手', type: 'plant', priceCoins: 500, priceGems: 0, effectJson: '104' },
      { name: '樱桃炸弹', type: 'plant', priceCoins: 200, priceGems: 0, effectJson: '105' },
      { name: '火爆辣椒', type: 'plant', priceCoins: 150, priceGems: 0, effectJson: '106' },
      { name: '寒冰菇', type: 'plant', priceCoins: 150, priceGems: 0, effectJson: '107' },
      { name: '毁灭菇', type: 'plant', priceCoins: 200, priceGems: 0, effectJson: '108' },
      { name: '玉米加农炮', type: 'plant', priceCoins: 500, priceGems: 0, effectJson: '109' },
      { name: '椰子加农炮', type: 'plant', priceCoins: 400, priceGems: 0, effectJson: '110' },
      { name: '香蕉火箭炮', type: 'plant', priceCoins: 300, priceGems: 0, effectJson: '111' },
      { name: '香蒲（猫尾草）', type: 'plant', priceCoins: 300, priceGems: 0, effectJson: '112' },
      { name: '忧郁蘑菇', type: 'plant', priceCoins: 200, priceGems: 0, effectJson: '113' },
      { name: '地刺王', type: 'plant', priceCoins: 150, priceGems: 0, effectJson: '114' },
      { name: '大嘴花', type: 'plant', priceCoins: 200, priceGems: 0, effectJson: '115' },
      { name: '三线射手', type: 'plant', priceCoins: 350, priceGems: 0, effectJson: '116' },
      { name: '激光豆', type: 'plant', priceCoins: 250, priceGems: 0, effectJson: '117' },
      { name: '导向蓟', type: 'plant', priceCoins: 300, priceGems: 0, effectJson: '118' },
      { name: '橡木弓手', type: 'plant', priceCoins: 250, priceGems: 0, effectJson: '119' },
      { name: '原始豌豆射手', type: 'plant', priceCoins: 200, priceGems: 0, effectJson: '120' },
    ]
    for (const item of rarePlants) {
      await prisma.item.create({ data: item })
    }
    console.log(`Seeded ${rarePlants.length} rare plant shop items`)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
