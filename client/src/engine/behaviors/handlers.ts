import type { BehaviorHandler, BehaviorContext } from './types'
import type { PlacedPlant, ActiveZombie, Projectile } from '../../types/game'
import {
  PLANT_CONFIGS, PEA_SPEED,
  CELL_W, CELL_H, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS, GRID_ROWS,
} from '../constants'
import { uid } from '../GameEngine'

// ── Helpers ──

function cellCenter(row: number, col: number) {
  return {
    x: GRID_OFFSET_X + col * CELL_W + CELL_W / 2,
    y: GRID_OFFSET_Y + row * CELL_H + CELL_H / 2,
  }
}

// ── shooter: 直线射手 ──
export const shooterHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return
    const isThreeWay = cfg.tags.includes('three_way')

    // Check for zombies in target row(s)
    const rows = isThreeWay
      ? [ctx.plant.row - 1, ctx.plant.row, ctx.plant.row + 1].filter(r => r >= 0 && r < GRID_ROWS)
      : [ctx.plant.row]

    const hasTarget = rows.some(r =>
      ctx.engine.zombies.some(z =>
        z.row === r && z.x > cellCenter(ctx.plant.row, ctx.plant.col).x - 20 &&
        (z.state === 'walking' || z.state === 'eating')
      )
    )

    if (!hasTarget) return
    ctx.plant.attackTimer = cfg.attackInterval

    const count = cfg.projectileCount || 1
    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    const isSlow = cfg.tags.includes('slow')
    const hasPushback = cfg.tags.includes('pushback')
    const hasButter = cfg.tags.includes('butter')
    const damage = ctx.plant.damage ?? cfg.damage

    for (const r of rows) {
      for (let i = 0; i < count; i++) {
        const p: Projectile = {
          id: uid(), x: x + 20 + i * 12, y: cellCenter(r, ctx.plant.col).y,
          row: r,
          speed: PEA_SPEED,
          damage,
          slow: isSlow,
          pushback: hasPushback ? (cfg.pushback || 40) : 0,
          stunChance: hasButter ? (cfg.stunChance || 0) : 0,
          stunDuration: hasButter ? (cfg.stunDuration || 4) : 0,
        }
        ctx.spawnProjectile(p)
      }
    }
    ctx.spawnParticles(x + 25, y, count, ['#76FF03', '#FFF'], 30, 60, 0.15)
  },
}

// ── lobber: 投掷类 ──
export const lobberHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const hasZombie = ctx.engine.zombies.some(z =>
      z.row === ctx.plant.row && z.x > cellCenter(ctx.plant.row, ctx.plant.col).x &&
      (z.state === 'walking' || z.state === 'eating')
    )
    const hasZombieOtherRow = ctx.engine.zombies.some(z =>
      Math.abs(z.row - ctx.plant.row) <= 1 &&
      z.x > cellCenter(ctx.plant.row, ctx.plant.col).x - 40 &&
      (z.state === 'walking' || z.state === 'eating')
    )

    if (!hasZombie && !hasZombieOtherRow) return
    ctx.plant.attackTimer = cfg.attackInterval

    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    const target = ctx.findZombieInRow(ctx.plant.row, cellCenter(ctx.plant.row, ctx.plant.col).x)
    const targetX = target ? target.x : x + 200

    const isSlow = cfg.tags.includes('slow')
    const p: Projectile = {
      id: uid(), x, y: y - 10, row: ctx.plant.row,
      speed: 250, damage: cfg.damage,
      slow: isSlow,
      splashRadius: cfg.splashRadius || 0,
      stunChance: cfg.stunChance || 0,
      stunDuration: cfg.stunDuration || 0,
      isLob: true, lobHeight: 60, lobProgress: 0,
      targetX, targetY: y + CELL_H / 2,
    }
    ctx.spawnProjectile(p)
    ctx.spawnParticles(x + 10, y - 15, 3, ['#FFF', '#CDDC39'], 20, 50, 0.2)
  },
}

// ── piercing: 穿透 ──
export const piercingHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const hasZombie = ctx.engine.zombies.some(z =>
      z.row === ctx.plant.row && z.x > cellCenter(ctx.plant.row, ctx.plant.col).x &&
      (z.state === 'walking' || z.state === 'eating')
    )
    if (!hasZombie) return
    ctx.plant.attackTimer = cfg.attackInterval

    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    const p: Projectile = {
      id: uid(), x: x + 20, y, row: ctx.plant.row,
      speed: PEA_SPEED * 1.5, damage: cfg.damage,
      slow: false, pierceCount: cfg.pierces || 99, hitZombies: [],
    }
    ctx.spawnProjectile(p)
    ctx.spawnParticles(x + 25, y, 3, ['#CE93D8', '#FFF'], 30, 60, 0.15)
  },
}

// ── tracking: 追踪弹 ──
export const trackingHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    // Find nearest zombie anywhere on field
    const alive = ctx.engine.zombies.filter(z => z.state === 'walking' || z.state === 'eating')
    if (alive.length === 0) return
    ctx.plant.attackTimer = cfg.attackInterval

    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    const target = alive[0]
    const p: Projectile = {
      id: uid(), x, y, row: target.row,
      speed: 350, damage: cfg.damage,
      slow: false,
      tracking: true, trackingTarget: target.id,
      balloonPop: cfg.tags.includes('balloon_pop'),
    }
    ctx.spawnProjectile(p)
    ctx.spawnParticles(x + 15, y, 2, ['#E91E63', '#FFF'], 20, 60, 0.15)
  },
}

// ── boomerang: 回旋镖 ──
export const boomerangHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const hasZombie = ctx.engine.zombies.some(z =>
      z.row === ctx.plant.row && z.x > cellCenter(ctx.plant.row, ctx.plant.col).x &&
      (z.state === 'walking' || z.state === 'eating')
    )
    if (!hasZombie) return
    ctx.plant.attackTimer = cfg.attackInterval

    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    const p: Projectile = {
      id: uid(), x, y, row: ctx.plant.row,
      speed: 280, damage: cfg.damage,
      slow: false,
      isBoomerang: true, boomerangPhase: 'out',
      maxRange: 350, traveledDistance: 0,
      pierceCount: cfg.pierces || 3,
    }
    ctx.spawnProjectile(p)
    ctx.spawnParticles(x + 15, y, 2, ['#FF9800', '#FFF'], 20, 50, 0.15)
  },
}

// ── cone_aoe: 锥形范围 ──
export const coneAoeHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    const coneW = cfg.coneWidth || 3
    const coneH = cfg.coneHeight || 1

    let hitAny = false
    for (let r = ctx.plant.row - coneH; r <= ctx.plant.row + coneH; r++) {
      for (const z of ctx.engine.zombies) {
        if (z.row !== r || z.state === 'dying') continue
        const dist = z.x - x
        if (dist > -10 && dist < coneW * CELL_W) {
          z.hp -= cfg.damage
          hitAny = true
          const zy = GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2
          ctx.spawnParticles(z.x, zy, 1, ['#FF5722', '#FF9800'], 10, 30, 0.2)
          if (z.hp <= 0) { z.state = 'dying'; ctx.engine.zombieDeathEffect(z) }
        }
      }
    }
    if (hitAny) {
      ctx.plant.attackTimer = cfg.attackInterval
      ctx.spawnParticles(x + 30, y - 10, 5, ['#FF5722', '#FF9800', '#FFEB3B'], 20, 60, 0.3)
    }
  },
}

// ── chain_aoe: 闪电链 ──
export const chainAoeHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const alive = ctx.engine.zombies.filter(z => z.state === 'walking' || z.state === 'eating')
    if (alive.length === 0) return

    // Find nearest zombie
    const { x: px, y: py } = cellCenter(ctx.plant.row, ctx.plant.col)
    alive.sort((a, b) => {
      const da = Math.hypot(a.x - px, (GRID_OFFSET_Y + a.row * CELL_H) - py)
      const db = Math.hypot(b.x - px, (GRID_OFFSET_Y + b.row * CELL_H) - py)
      return da - db
    })

    let lastX = px
    let lastY = py
    const chainCount = cfg.chainCount || 4
    const hit = new Set<string>()

    for (let i = 0; i < Math.min(chainCount, alive.length); i++) {
      const z = alive[i]
      if (hit.has(z.id)) continue
      hit.add(z.id)
      z.hp -= cfg.damage
      const zy = GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2
      // Lightning arc particles
      ctx.spawnParticles((lastX + z.x) / 2, (lastY + zy) / 2, 3, ['#FFF', '#FFEB3B', '#FFF176'], 20, 60, 0.2)
      lastX = z.x
      lastY = zy
      if (z.hp <= 0) { z.state = 'dying'; ctx.engine.zombieDeathEffect(z) }
    }

    ctx.plant.attackTimer = cfg.attackInterval
  },
}

// ── radial_aoe: 周围AOE ──
export const radialAoeHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    let hitAny = false

    for (const z of ctx.engine.zombies) {
      if (z.state === 'dying') continue
      const zy = GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2
      const dist = Math.hypot(z.x - x, zy - y)
      if (dist < CELL_W * 1.8) {
        z.hp -= cfg.damage
        hitAny = true
        ctx.spawnParticles(z.x, zy, 1, ['#CE93D8', '#7B1FA2'], 10, 30, 0.2)
        if (z.hp <= 0) { z.state = 'dying'; ctx.engine.zombieDeathEffect(z) }
      }
    }

    if (hitAny) {
      ctx.plant.attackTimer = cfg.attackInterval
      // Poison cloud puff
      ctx.spawnParticles(x, y, 6, ['#CE93D8', '#E1BEE7', '#FFF'], 15, 40, 0.4)
    }
  },
}

// ── sun_producer: 阳光生产 ──
export const sunProducerHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    ctx.plant.attackTimer = cfg.sunInterval || cfg.attackInterval
    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    const sx = x + (Math.random() - 0.5) * 40
    const amount = cfg.sunAmount || 50
    ctx.engine.sunDrops.push({
      id: uid(), x: sx, y: y - 30,
      targetY: y + 60 + Math.random() * 30,
      value: amount, timer: 10, collected: false,
    })
    ctx.spawnParticles(x, y - 20, 3, ['#FFEB3B', '#FFF'], 15, 40, 0.25)
  },
}

// ── sun_producer_growing: 阳光菇 ──
export const sunProducerGrowingHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    // Grow over time
    ctx.plant.growTimer = (ctx.plant.growTimer || 0) + ctx.dt
    if (cfg.growStages && ctx.plant.growStage === undefined) ctx.plant.growStage = 0
    const stages = cfg.growStages || []
    const stage = ctx.plant.growStage || 0
    if (stage < stages.length - 1 && ctx.plant.growTimer >= stages[stage + 1].time) {
      ctx.plant.growStage = stage + 1
      ctx.plant.hp = 300 + (stage + 1) * 50 // grows bigger
    }

    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    ctx.plant.attackTimer = cfg.attackInterval
    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    const sx = x + (Math.random() - 0.5) * 30
    const amount = stages[ctx.plant.growStage || 0]?.sunAmount || cfg.sunAmount || 15
    ctx.engine.sunDrops.push({
      id: uid(), x: sx, y: y - 20,
      targetY: y + 50 + Math.random() * 20,
      value: amount, timer: 10, collected: false,
    })
    ctx.spawnParticles(x, y - 15, 2, ['#FFCC02', '#FFF'], 10, 30, 0.2)
  },
}

// ── wall / wall_regen — no active update, passive defense ──
export const wallHandler: BehaviorHandler = {}

export const wallRegenHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    // Check if destroyed and can regenerate
    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return
    if (ctx.plant.hp <= 0 && !ctx.plant.hasRegenerated && (cfg.regenCount || 0) > 0) {
      ctx.plant.hp = cfg.maxHp || cfg.hp
      ctx.plant.hasRegenerated = true
      const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
      ctx.spawnParticles(x, y, 10, ['#2196F3', '#FFF', '#64B5F6'], 30, 100, 0.5)
    }
  },
}

// ── wall_knockback: 击退墙 ──
export const wallKnockbackHandler: BehaviorHandler = {
  onContact(ctx: BehaviorContext, zombie: ActiveZombie) {
    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return
    zombie.x += cfg.pushback || 60
    zombie.state = 'walking'
    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    ctx.spawnParticles(x + 20, y, 5, ['#E91E63', '#FFF'], 20, 60, 0.3)
  },
}

// ── mine: 地雷 ──
export const mineHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    if (ctx.plant.attackTimer < 15) {
      ctx.plant.attackTimer += ctx.dt
    }
    if (ctx.plant.attackTimer >= 15) {
      ctx.plant.armed = true
    }
  },
  onContact(ctx: BehaviorContext) {
    if (!ctx.plant.armed) return
    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return
    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    ctx.spawnParticles(x, y, 25, ['#FF5722', '#FF9800', '#FFEB3B', '#FFF', '#F44336'], 80, 350, 0.7)
    // Blast 3x3 grid
    for (let r = ctx.plant.row - 1; r <= ctx.plant.row + 1; r++) {
      for (let c = ctx.plant.col - 1; c <= ctx.plant.col + 1; c++) {
        if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) continue
        for (const z of ctx.engine.zombies) {
          if (z.row === r && z.state !== 'dying') {
            const cx = GRID_OFFSET_X + c * CELL_W + CELL_W / 2
            if (Math.abs(z.x - cx) < CELL_W) {
              z.hp -= cfg.damage
              if (z.hp <= 0) { z.state = 'dying'; ctx.engine.zombieDeathEffect(z) }
            }
          }
        }
      }
    }
    ctx.removePlant()
  },
}

// ── spikeweed: 地刺 ──
export const spikeweedHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return
    ctx.plant.attackTimer = cfg.attackInterval

    const cx = GRID_OFFSET_X + ctx.plant.col * CELL_W + CELL_W / 2
    for (const z of ctx.engine.zombies) {
      if (z.row === ctx.plant.row && z.state !== 'dying') {
        if (Math.abs(z.x - cx) < CELL_W / 2) {
          z.hp -= cfg.damage
          const zy = GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2 + 40
          ctx.spawnParticles(z.x, zy, 2, ['#B0BEC5', '#FFF'], 10, 30, 0.2)
          if (z.hp <= 0) { z.state = 'dying'; ctx.engine.zombieDeathEffect(z) }
        }
      }
    }
  },
}

// ── water_trap: 缠绕水草 ──
export const waterTrapHandler: BehaviorHandler = {
  onContact(ctx: BehaviorContext, zombie: ActiveZombie) {
    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    zombie.state = 'dying'
    ctx.engine.zombieDeathEffect(zombie)
    ctx.spawnParticles(x, y, 6, ['#00796B', '#4DB6AC', '#FFF'], 20, 80, 0.4)
    ctx.removePlant()
  },
}

// ── eater: 大嘴花 ──
export const eaterHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const px = cellCenter(ctx.plant.row, ctx.plant.col).x
    const target = ctx.engine.zombies.find(z =>
      z.row === ctx.plant.row &&
      z.x > px - 10 && z.x < px + 50 &&
      (z.state === 'walking' || z.state === 'eating')
    )
    if (target) {
      target.state = 'dying'
      ctx.engine.zombieDeathEffect(target)
      const zy = GRID_OFFSET_Y + ctx.plant.row * CELL_H + CELL_H / 2
      ctx.spawnParticles(target.x, zy, 8, ['#CE93D8', '#7B1FA2', '#FFF'], 30, 100, 0.4)
      ctx.plant.attackTimer = cfg.attackInterval
    }
  },
}

// ── instant_3x3: 樱桃炸弹/毁灭菇 ──
export const instant3x3Handler: BehaviorHandler = {
  onPlace(ctx: BehaviorContext) {
    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const delay = 600 // ms delay before boom
    setTimeout(() => {
      const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
      const radius = cfg.splashRadius || 1
      const count = 25 + (cfg.splashRadius || 1) * 10
      ctx.spawnParticles(x, y, count, ['#FF5722', '#FF9800', '#FFEB3B', '#FFF', '#F44336'], 100, 500, 0.8)

      for (let r = ctx.plant.row - radius; r <= ctx.plant.row + radius; r++) {
        for (let c = ctx.plant.col - radius; c <= ctx.plant.col + radius; c++) {
          if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) continue
          // Doom-shroom leaves craters
          if (ctx.plant.plantType === 108) {
            ctx.engine.craters.add(`${r},${c}`)
          }
          for (const z of ctx.engine.zombies) {
            if (z.row === r && (z.state === 'walking' || z.state === 'eating')) {
              z.hp -= cfg.damage
              if (z.hp <= 0) { z.state = 'dying'; ctx.engine.zombieDeathEffect(z) }
            }
          }
        }
      }
      ctx.removePlant()
    }, delay)
  },
}

// ── instant_row: 火爆辣椒 ──
export const instantRowHandler: BehaviorHandler = {
  onPlace(ctx: BehaviorContext) {
    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    setTimeout(() => {
      const row = ctx.plant.row
      for (let c = 0; c < GRID_COLS; c++) {
        const { x, y } = cellCenter(row, c)
        ctx.spawnParticles(x, y, 5, ['#FF5722', '#FF9800', '#FFF'], 30, 100, 0.5)
      }
      for (const z of ctx.engine.zombies) {
        if (z.row === row) {
          z.hp -= cfg.damage
          if (z.hp <= 0) { z.state = 'dying'; ctx.engine.zombieDeathEffect(z) }
        }
      }
      ctx.removePlant()
    }, 600)
  },
}

// ── instant_freeze: 寒冰菇 ──
export const instantFreezeHandler: BehaviorHandler = {
  onPlace(ctx: BehaviorContext) {
    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    setTimeout(() => {
      const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
      ctx.spawnParticles(x, y, 20, ['#64B5F6', '#FFF', '#BBDEFB'], 60, 200, 0.6)
      for (const z of ctx.engine.zombies) {
        z.stunned = true
        z.stunTimer = (cfg.stunDuration || 5)
        z.speed = 0
        z.hp -= cfg.damage
        const zy = GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2
        ctx.spawnParticles(z.x, zy, 3, ['#64B5F6', '#FFF'], 10, 30, 0.3)
        if (z.hp <= 0) { z.state = 'dying'; ctx.engine.zombieDeathEffect(z) }
      }
      ctx.removePlant()
    }, 400)
  },
}

// ── launcher: 导弹发射器 ──
export const launcherHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const alive = ctx.engine.zombies.filter(z => z.state === 'walking' || z.state === 'eating')
    if (alive.length === 0) return

    // Find best target: densest area or strongest zombie
    const rowRange = cfg.launcherRows || 0
    let targetX = alive[0].x
    let targetRow = alive[0].row

    if (rowRange > 0) {
      // Find densest area
      let bestDensity = 0
      for (let r = 0; r < GRID_ROWS; r++) {
        const inRange = alive.filter(z => Math.abs(z.row - r) <= rowRange)
        if (inRange.length > bestDensity) {
          bestDensity = inRange.length
          const avgX = inRange.reduce((s, z) => s + z.x, 0) / inRange.length
          targetX = avgX
          targetRow = r
        }
      }
    }

    ctx.plant.attackTimer = cfg.attackInterval
    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)

    // Launch missile
    const p: Projectile = {
      id: uid(), x, y: y - 15, row: targetRow,
      speed: 400, damage: cfg.damage,
      slow: false,
      isLob: true, lobHeight: 150, lobProgress: 0,
      targetX, targetY: GRID_OFFSET_Y + targetRow * CELL_H + CELL_H / 2,
      splashRadius: cfg.splashRadius || 2,
    }
    ctx.spawnProjectile(p)
    ctx.spawnParticles(x + 10, y - 20, 5, ['#FF5722', '#FFF', '#FF9800'], 30, 80, 0.3)
  },
}

// ── magnet: 磁力菇 ──
export const magnetHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return
    ctx.plant.attackTimer = cfg.attackInterval

    // Steal iron from nearby bucket/football zombies
    const ironTypes = [3, 7] // buckethead (3), football (7)
    for (const z of ctx.engine.zombies) {
      if (ironTypes.includes(z.zombieType) && !z.hasIron) {
        if (Math.abs(z.row - ctx.plant.row) <= 2 && z.x > 0) {
          z.hasIron = true
          z.hp -= 300 // remove armor
          z.maxHp = z.hp
          z.speed = ZOMBIE_CONFIGS[z.zombieType - 1]?.speed || z.speed
          const zy = GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2
          ctx.spawnParticles(z.x, zy, 5, ['#B0BEC5', '#90A4AE', '#FFF'], 20, 60, 0.3)
          break // one per cycle
        }
      }
    }
  },
}

// Import zombie configs for magnet
import { ZOMBIE_CONFIGS } from '../constants'

// ── avocado: 鳄梨 ──
export const avocadoHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const px = cellCenter(ctx.plant.row, ctx.plant.col).x
    const target = ctx.engine.zombies.find(z =>
      z.row === ctx.plant.row && z.x > px - 40 && z.x < px + 40 &&
      (z.state === 'walking' || z.state === 'eating')
    )

    if (target) {
      target.hp -= cfg.damage
      const zy = GRID_OFFSET_Y + target.row * CELL_H + CELL_H / 2
      ctx.spawnParticles(target.x, zy, 3, ['#558B2F', '#8BC34A'], 10, 40, 0.2)
      ctx.plant.attackTimer = cfg.attackInterval
      if (target.hp <= 0) { target.state = 'dying'; ctx.engine.zombieDeathEffect(target) }
    }
  },
  onContact(ctx: BehaviorContext) {
    // When eaten, charge forward damaging all zombies in row
    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return
    const row = ctx.plant.row
    for (const z of ctx.engine.zombies) {
      if (z.row === row && z.state !== 'dying') {
        z.hp -= cfg.damage * 3
        if (z.hp <= 0) { z.state = 'dying'; ctx.engine.zombieDeathEffect(z) }
      }
    }
    const { x, y } = cellCenter(row, ctx.plant.col)
    ctx.spawnParticles(x, y, 12, ['#558B2F', '#8BC34A', '#FFF'], 40, 150, 0.5)
  },
}

// ── celery: 潜伏芹菜 ──
export const celeryHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const px = cellCenter(ctx.plant.row, ctx.plant.col).x
    // Attack zombies BEHIND the celery (x < plant x)
    const target = ctx.engine.zombies.find(z =>
      z.row === ctx.plant.row && z.x < px && z.x > px - 80 &&
      (z.state === 'walking' || z.state === 'eating')
    )

    if (target) {
      target.hp -= cfg.damage
      target.stunned = true
      target.stunTimer = 0.5
      const zy = GRID_OFFSET_Y + target.row * CELL_H + CELL_H / 2
      ctx.spawnParticles(target.x + 10, zy, 4, ['#4CAF50', '#FFF'], 20, 60, 0.3)
      ctx.plant.attackTimer = cfg.attackInterval
      if (target.hp <= 0) { target.state = 'dying'; ctx.engine.zombieDeathEffect(target) }
    }
  },
}

// ── ghost_pepper: 幽灵辣椒 ──
export const ghostPepperHandler: BehaviorHandler = {
  onPlace(ctx: BehaviorContext) {
    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)

    // Fear: slow nearby zombies
    for (const z of ctx.engine.zombies) {
      const zy = GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2
      if (Math.hypot(z.x - x, zy - y) < CELL_W * 2.5) {
        z.slowed = true
        z.slowTimer = 3
        z.speed = z.baseSpeed * 0.4
        ctx.spawnParticles(z.x, zy, 2, ['#E91E63', '#FFF'], 10, 30, 0.2)
      }
    }

    // Then explode after delay
    setTimeout(() => {
      for (const z of ctx.engine.zombies) {
        const zy = GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2
        if (Math.hypot(z.x - x, zy - y) < CELL_W * 2.5 && z.state !== 'dying') {
          z.hp -= cfg.damage
          if (z.hp <= 0) { z.state = 'dying'; ctx.engine.zombieDeathEffect(z) }
        }
      }
      ctx.spawnParticles(x, y, 15, ['#E91E63', '#CE93D8', '#FFF'], 50, 150, 0.6)
      ctx.removePlant()
    }, 2000)
  },
}

// ── hot_date: 热辣海枣 ──
export const hotDateHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    // Passive: attract nearby zombies (they target this plant more)
    // This is handled naturally by the engine's zombie AI
  },
  onContact(ctx: BehaviorContext) {
    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return
    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    const radius = cfg.splashRadius || 2
    for (let r = ctx.plant.row - radius; r <= ctx.plant.row + radius; r++) {
      if (r < 0 || r >= GRID_ROWS) continue
      for (const z of ctx.engine.zombies) {
        if (z.row === r && z.state !== 'dying') {
          z.hp -= cfg.damage
          if (z.hp <= 0) { z.state = 'dying'; ctx.engine.zombieDeathEffect(z) }
        }
      }
    }
    ctx.spawnParticles(x, y, 20, ['#FF5722', '#FF9800', '#FFF'], 60, 200, 0.6)
  },
}

// ── bonk_choy: 抱抱菜 近战快拳 ──
export const bonkChoyHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return

    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const px = cellCenter(ctx.plant.row, ctx.plant.col).x
    // Attack zombies in adjacent cells (left and right)
    const targets = ctx.engine.zombies.filter(z =>
      Math.abs(z.row - ctx.plant.row) <= 1 &&
      Math.abs(z.x - px) < CELL_W * 1.2 &&
      (z.state === 'walking' || z.state === 'eating')
    )

    if (targets.length > 0) {
      for (const z of targets.slice(0, 2)) {
        z.hp -= cfg.damage
        const zy = GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2
        ctx.spawnParticles(z.x, zy, 2, ['#8BC34A', '#FFF'], 10, 30, 0.15)
        if (z.hp <= 0) { z.state = 'dying'; ctx.engine.zombieDeathEffect(z) }
      }
      ctx.plant.attackTimer = cfg.attackInterval
    }
  },
}

// ── form_shift: 红针花 形态切换 ──
export const formShiftHandler: BehaviorHandler = {
  onPlace(ctx: BehaviorContext) {
    const cfg = PLANT_CONFIGS[ctx.plant.plantType]
    if (!cfg) return

    const col = ctx.plant.col
    if (col <= 2) {
      // Attack form: 2x damage, base HP
      ctx.plant.damage = cfg.damage * 2
      ctx.plant.hp = cfg.hp
      ctx.plant.maxHp = cfg.hp
    } else if (col >= 6) {
      // Defense form: 0.5x damage, 3x HP
      ctx.plant.damage = cfg.damage * 0.5
      ctx.plant.hp = cfg.hp * 3
      ctx.plant.maxHp = cfg.hp * 3
    } else {
      // Balanced form: 1x damage, 2x HP
      ctx.plant.damage = cfg.damage
      ctx.plant.hp = cfg.hp * 2
      ctx.plant.maxHp = cfg.hp * 2
    }
  },
}

// ── spore: 孢子菇 ──
// Handled by projectile collision: when a spore kills a zombie, spawn new plant
// The spore tag is a projectile modifier, no plant update needed
export const sporeHandler: BehaviorHandler = {}

// ── light: 路灯花 ──
export const lightHandler: BehaviorHandler = {
  onUpdate(ctx: BehaviorContext) {
    // Passive: lights up fog area (visual effect only for now)
    // Glow effect every few seconds
    ctx.plant.attackTimer -= ctx.dt
    if (ctx.plant.attackTimer > 0) return
    ctx.plant.attackTimer = 3
    const { x, y } = cellCenter(ctx.plant.row, ctx.plant.col)
    ctx.spawnParticles(x, y, 1, ['#FFEB3B', '#FFF176'], 5, 15, 0.8)
  },
}
