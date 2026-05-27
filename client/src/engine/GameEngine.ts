import { eventBus } from './EventBus'
import type { PlacedPlant, ActiveZombie, Projectile } from '../types/game'
import {
  PLANT_CONFIGS, ZOMBIE_CONFIGS, CELL_W, CELL_H,
  GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS, GRID_ROWS, ZOMBIE_SPAWN_X,
  LAWN_MOWER_X, PEA_SPEED, SUN_DROP_INTERVAL, SUN_LIFETIME, SUN_VALUE,
} from './constants'
import { behaviorRegistry } from './behaviors'

let uidCounter = 0
export function uid(): string { return `e${++uidCounter}` }

export interface SunDrop {
  id: string
  x: number
  y: number
  targetY: number
  value: number
  timer: number
  collected: boolean
  collectX?: number
  collectY?: number
  collectProgress?: number
}

export interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; color: string; size: number
  gravity?: number
}

export class GameEngine {
  plants: PlacedPlant[] = []
  zombies: ActiveZombie[] = []
  projectiles: Projectile[] = []
  sunDrops: SunDrop[] = []
  particles: Particle[] = []

  sun = 200
  mowersUsed = 0
  endStars = 0
  endCoins = 0
  selectedPlantType: number | null = null
  selectedTool: 'plant' | 'shovel' | null = 'plant'
  gamePhase: 'preparing' | 'playing' | 'paused' | 'won' | 'lost' = 'preparing'
  currentWave = 0
  totalWaves = 2
  waveProgress = 0
  allWavesSpawned = false
  lawnMowers: boolean[] = [true, true, true, true, true]
  craters = new Set<string>()  // "row,col" strings for Doom-shroom craters

  private plantCooldowns: Record<number, number> = {}
  private sunDropTimer = 0
  private isNight = false
  private hasPool = false
  private spawnQueue: { type: number; row: number }[] = []
  private spawnTimer = 0
  private spawnInterval = 0.8
  private trickleTimer = 0
  private gameTime = 0
  floatingTexts: { x: number; y: number; text: string; life: number; vy: number }[] = []
  private sunFlyParticles: { x: number; y: number; targetX: number; targetY: number; life: number; maxLife: number; value: number }[] = []

  get sunFlyParts() { return this.sunFlyParticles }

  constructor() {
    eventBus.on('plant:select', (type: number | null) => { this.selectedPlantType = type; this.selectedTool = 'plant' })
    eventBus.on('tool:select', (tool: 'plant' | 'shovel') => { this.selectedTool = tool })
    eventBus.on('grid:click', (row: number, col: number) => this.handleGridClick(row, col))
    eventBus.on('game:start', () => this.startGame())
    eventBus.on('game:pause', () => { if (this.gamePhase === 'playing') { this.gamePhase = 'paused'; eventBus.emit('game:phase', 'paused') } })
    eventBus.on('game:resume', () => { if (this.gamePhase === 'paused') { this.gamePhase = 'playing'; eventBus.emit('game:phase', 'playing') } })
  }

  configure(opts: { isNight?: boolean; hasPool?: boolean; totalWaves?: number }) {
    if (opts.isNight !== undefined) this.isNight = opts.isNight
    if (opts.hasPool !== undefined) this.hasPool = opts.hasPool
    if (opts.totalWaves !== undefined) this.totalWaves = opts.totalWaves
  }

  startGame() {
    this.gamePhase = 'playing'
    this.currentWave = 0
    this.waveProgress = 0
    this.allWavesSpawned = false
    this.spawnQueue = []
    this.spawnTimer = 0
    this.trickleTimer = 3
    eventBus.emit('game:phase', 'playing')
    eventBus.emit('wave:updated', this.currentWave, this.totalWaves)
  }

  // ── Behavior Context Factory ──
  private createBehaviorContext(plant: PlacedPlant, dt: number) {
    const self = this
    return {
      plant,
      engine: self,
      dt,
      getGridCenter: (r: number, c: number) => ({
        x: GRID_OFFSET_X + c * CELL_W + CELL_W / 2,
        y: GRID_OFFSET_Y + r * CELL_H + CELL_H / 2,
      }),
      spawnProjectile: (p: Projectile) => { self.projectiles.push(p) },
      spawnParticles: (x: number, y: number, count: number, colors: string[], speedMin: number, speedMax: number, maxLife: number) => {
        self.spawnParticles(x, y, count, colors, speedMin, speedMax, maxLife)
      },
      findZombieInRow: (row: number, minX?: number) => {
        return self.zombies.find(z =>
          z.row === row &&
          z.x > (minX || 0) &&
          (z.state === 'walking' || z.state === 'eating')
        )
      },
      findZombiesInArea: (centerRow: number, centerCol: number, rowRadius: number, colRadius: number) => {
        const cx = GRID_OFFSET_X + centerCol * CELL_W + CELL_W / 2
        return self.zombies.filter(z => {
          if (z.state === 'dying') return false
          if (Math.abs(z.row - centerRow) > rowRadius) return false
          if (colRadius > 0 && Math.abs(z.x - cx) > colRadius * CELL_W) return false
          return true
        })
      },
      removePlant: () => {
        const idx = self.plants.indexOf(plant)
        if (idx !== -1) self.plants.splice(idx, 1)
      },
    }
  }

  // ── Public death effect for behavior handlers ──
  zombieDeathEffect(z: ActiveZombie) {
    const baseY = GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2
    this.spawnParticles(z.x, baseY, 10, ['#666', '#9E9E9E', '#BDBDBD'], 30, 100, 0.5)
  }

  private handleGridClick(row: number, col: number) {
    if (this.gamePhase !== 'playing') return

    if (this.selectedTool === 'shovel') {
      const idx = this.plants.findIndex(p => p.row === row && p.col === col)
      if (idx !== -1) {
        const { x, y } = this.getGridCenter(row, col)
        this.spawnParticles(x, y, 8, ['#8D6E63', '#5D4037', '#A1887F'], 40, 120, 0.4)
        this.plants.splice(idx, 1)
        eventBus.emit('plant:removed', row, col)
      }
      return
    }

    if (this.selectedPlantType === null) return
    const config = PLANT_CONFIGS[this.selectedPlantType]
    if (!config) return

    if (this.plants.some(p => p.row === row && p.col === col)) return
    if (this.sun < config.cost) return
    if ((this.plantCooldowns[this.selectedPlantType] || 0) > 0) return

    // Pool restriction
    if (this.hasPool && (row === 2 || row === 3) && !config.aquatic) return

    // Crater check
    if (this.craters.has(`${row},${col}`)) return

    this.sun -= config.cost
    this.plantCooldowns[this.selectedPlantType] = config.cooldown

    const plant: PlacedPlant = {
      id: uid(),
      plantType: this.selectedPlantType,
      row,
      col,
      hp: config.hp,
      maxHp: config.maxHp,
      attackTimer: 0,
    }

    this.plants.push(plant)
    const { x, y } = this.getGridCenter(row, col)
    this.spawnParticles(x, y, 6, ['#81C784', '#FFF', '#A5D6A7'], 30, 80, 0.35)
    eventBus.emit('plant:placed', plant)

    // Dispatch onPlace for instant-effect plants
    const ctx = this.createBehaviorContext(plant, 0)
    for (const tag of config.tags) {
      behaviorRegistry.get(tag)?.onPlace?.(ctx)
    }
  }

  private getGridCenter(row: number, col: number) {
    return {
      x: GRID_OFFSET_X + col * CELL_W + CELL_W / 2,
      y: GRID_OFFSET_Y + row * CELL_H + CELL_H / 2,
    }
  }

  private spawnParticles(x: number, y: number, count: number, colors: string[], speedMin: number, speedMax: number, maxLife: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = speedMin + Math.random() * (speedMax - speedMin)
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: maxLife * (0.5 + Math.random() * 0.5),
        maxLife: maxLife,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 5,
        gravity: 150 + Math.random() * 100,
      })
    }
  }

  private spawnZombie(type: number, row: number, summoned = false) {
    const config = ZOMBIE_CONFIGS[type]
    if (!config) return
    const zombie: ActiveZombie = {
      id: uid(),
      zombieType: type,
      row,
      x: ZOMBIE_SPAWN_X,
      hp: config.hp,
      maxHp: config.hp,
      speed: config.speed,
      baseSpeed: config.speed,
      state: 'walking',
      summoned,
    }
    this.zombies.push(zombie)
    const baseY = GRID_OFFSET_Y + row * CELL_H + CELL_H / 2
    this.spawnParticles(ZOMBIE_SPAWN_X, baseY, 5, ['#666', '#888'], 20, 60, 0.3)
    eventBus.emit('zombie:spawned', zombie)

    if (config.summons && !summoned) {
      for (let i = 0; i < 4; i++) {
        const dancerRow = Math.max(0, Math.min(4, row + (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2))))
        this.spawnZombie(1, dancerRow, true)
      }
    }
  }

  update(dt: number) {
    if (this.gamePhase !== 'playing') return

    this.gameTime += dt

    // Cooldowns
    for (const key of Object.keys(this.plantCooldowns)) {
      this.plantCooldowns[Number(key)] = Math.max(0, (this.plantCooldowns[Number(key)] || 0) - dt)
    }

    // Sky sun drops
    if (!this.isNight) {
      this.sunDropTimer -= dt
      if (this.sunDropTimer <= 0) {
        this.sunDropTimer = SUN_DROP_INTERVAL / 1000 + Math.random() * 4
        const dropX = GRID_OFFSET_X + Math.random() * (GRID_COLS * CELL_W)
        this.sunDrops.push({
          id: uid(), x: dropX, y: -20, targetY: 300 + Math.random() * 250,
          value: SUN_VALUE, timer: SUN_LIFETIME / 1000, collected: false,
        })
      }
    }

    // Update & auto-collect sun drops
    for (const sun of this.sunDrops) {
      if (sun.collected) {
        sun.collectProgress = (sun.collectProgress || 0) + dt * 3
        continue
      }
      sun.y += 40 * dt
      sun.timer -= dt
      if ((sun.y >= sun.targetY || sun.timer <= 0) && !sun.collected) {
        sun.collected = true
        sun.collectX = sun.x
        sun.collectY = sun.y
        sun.collectProgress = 0
        this.sun += sun.value
        eventBus.emit('sun:updated', this.sun)
        this.spawnParticles(sun.x, sun.y, 5, ['#FFD600', '#FFAB00', '#FFF176'], 20, 80, 0.4)
        this.sunFlyParticles.push({
          x: sun.x, y: sun.y,
          targetX: 80, targetY: 30,
          life: 0.5, maxLife: 0.5,
          value: sun.value,
        })
      }
    }

    this.sunDrops = this.sunDrops.filter(s => {
      if (s.collected && (s.collectProgress || 0) >= 1) return false
      if (!s.collected && s.timer <= 0) return false
      return true
    })

    // Sun fly-to-counter particles
    for (const fp of this.sunFlyParticles) { fp.life -= dt }
    this.sunFlyParticles = this.sunFlyParticles.filter(fp => fp.life > 0)

    // ── Plant Behaviors via Tag Dispatch ──
    for (const plant of this.plants) {
      const cfg = PLANT_CONFIGS[plant.plantType]
      if (!cfg) continue

      const ctx = this.createBehaviorContext(plant, dt)
      for (const tag of cfg.tags) {
        behaviorRegistry.get(tag)?.onUpdate?.(ctx)
      }
    }

    // ── Projectile Update ──
    for (const p of this.projectiles) {
      // Lob/arc trajectory
      if (p.isLob) {
        p.lobProgress = (p.lobProgress || 0) + dt * (p.speed / 300)
        if (p.lobProgress! >= 1) {
          p.isLob = false // reached target
        }
        const progress = p.lobProgress || 0
        const startX = p.x
        const startY = p.y
        const targetX = p.targetX || p.x + 200
        const targetY = p.targetY || p.y + 100
        const currentX = startX + (targetX - startX) * progress
        const arc = Math.sin(progress * Math.PI) * (p.lobHeight || 60)
        p.x = currentX
        p.y = startY + (targetY - startY) * progress - arc
        // Update row based on current Y
        p.row = Math.floor((p.y - GRID_OFFSET_Y + 30) / CELL_H)
        if (p.row < 0) p.row = 0
        if (p.row >= GRID_ROWS) p.row = GRID_ROWS - 1
      } else if (p.tracking && p.trackingTarget) {
        // Track target zombie
        const target = this.zombies.find(z => z.id === p.trackingTarget && z.state !== 'dying')
        if (target) {
          const ty = GRID_OFFSET_Y + target.row * CELL_H + CELL_H / 2
          const dx = target.x - p.x
          const dy = ty - p.y
          const dist = Math.hypot(dx, dy) || 1
          p.x += (dx / dist) * p.speed * dt
          p.y += (dy / dist) * p.speed * dt
          p.row = target.row
        } else {
          // Target dead — find new target or fly off
          const alive = this.zombies.filter(z => z.state !== 'dying')
          if (alive.length > 0) {
            p.trackingTarget = alive[0].id
          } else {
            p.x += p.speed * dt
          }
        }
      } else if (p.isBoomerang) {
        p.traveledDistance = (p.traveledDistance || 0) + p.speed * dt
        if (p.boomerangPhase === 'out' && p.traveledDistance >= (p.maxRange || 350)) {
          p.boomerangPhase = 'return'
        }
        const dir = p.boomerangPhase === 'return' ? -1 : 1
        p.x += p.speed * dt * dir
        if (p.boomerangPhase === 'return' && p.traveledDistance > (p.maxRange || 350) * 2) {
          p.x = 9999 // expired
        }
      } else {
        p.x += p.speed * dt
      }
    }
    this.projectiles = this.projectiles.filter(p => p.x > -100 && p.x < 1000 && p.y > -100 && p.y < 700)

    // ── Projectile vs Zombie Collision ──
    for (const p of this.projectiles) {
      let pRemoved = false

      for (const z of this.zombies) {
        if (z.state === 'dying') continue
        if (p.pierceCount !== undefined && p.hitZombies?.includes(z.id)) continue

        const zy = GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2
        const hitRange = p.splashRadius ? 60 : 22
        const rowRange = p.tracking ? 5 : (p.splashRadius ? 2 : 0)

        if (Math.abs(p.x - z.x) < hitRange && Math.abs(p.y - zy) < 45 + rowRange * CELL_H) {
          z.hp -= p.damage

          // Slow
          if (p.slow) {
            z.slowed = true
            z.slowTimer = 2
            z.speed = z.baseSpeed * 0.5
          }

          // Pushback
          if (p.pushback && p.pushback > 0) {
            z.x += p.pushback
            z.state = 'walking'
          }

          // Stun
          if (p.stunChance && Math.random() < p.stunChance) {
            z.stunned = true
            z.stunTimer = p.stunDuration || 4
            z.speed = 0
          }

          // Hit effect
          const sparkColors = p.slow ? ['#64B5F6', '#FFF', '#BBDEFB'] : ['#76FF03', '#FFF', '#CDDC39']
          this.spawnParticles(p.x, p.y, 3, sparkColors, 20, 60, 0.2)

          // Splash damage
          if (p.splashRadius && p.splashRadius > 0) {
            const radius = p.splashRadius * CELL_W
            for (const zz of this.zombies) {
              if (zz === z || zz.state === 'dying') continue
              if (Math.abs(zz.row - z.row) <= p.splashRadius) {
                const zzy = GRID_OFFSET_Y + zz.row * CELL_H + CELL_H / 2
                if (Math.hypot(zz.x - z.x, zzy - zy) < radius) {
                  zz.hp -= p.damage * 0.6
                  this.spawnParticles(zz.x, zzy, 2, ['#FF9800', '#FFF'], 10, 30, 0.2)
                  if (zz.hp <= 0) { zz.state = 'dying'; this.zombieDeathEffect(zz) }
                }
              }
            }
          }

          // Spore: if zombie dies, spawn new spore-shroom
          if (z.hp <= 0) {
            z.state = 'dying'
            this.zombieDeathEffect(z)
            // Check if projectile is from spore plant
            if (p.projectileType === 'spore') {
              const sporeCol = Math.floor((z.x - GRID_OFFSET_X) / CELL_W)
              if (sporeCol >= 0 && sporeCol < GRID_COLS) {
                const existingPlant = this.plants.some(pl => pl.row === z.row && pl.col === sporeCol)
                if (!existingPlant) {
                  const newPlant: PlacedPlant = {
                    id: uid(), plantType: 27, row: z.row, col: sporeCol,
                    hp: 300, attackTimer: 0,
                  }
                  this.plants.push(newPlant)
                  this.spawnParticles(z.x, zy, 6, ['#7B1FA2', '#CE93D8', '#FFF'], 20, 80, 0.4)
                  eventBus.emit('plant:placed', newPlant)
                }
              }
            }
          }

          // Pierce: mark zombie hit, don't remove projectile
          if (p.pierceCount !== undefined && p.pierceCount > 0) {
            if (!p.hitZombies) p.hitZombies = []
            p.hitZombies.push(z.id)
            p.pierceCount--
            if (p.pierceCount <= 0) pRemoved = true
          } else {
            pRemoved = true
          }

          // Chain lightning
          if (p.chainCount && p.chainCount > 0 && !pRemoved) {
            p.chainCount--
            // Find nearest unhit zombie
            let nearest: ActiveZombie | null = null
            let nearestDist = p.chainRange || 200
            for (const cz of this.zombies) {
              if (cz === z || cz.state === 'dying') continue
              const czy = GRID_OFFSET_Y + cz.row * CELL_H + CELL_H / 2
              const dist = Math.hypot(cz.x - z.x, czy - zy)
              if (dist < nearestDist) {
                nearestDist = dist
                nearest = cz
              }
            }
            if (nearest) {
              p.row = nearest.row
              // Continue to next zombie (position projectile at hit location)
              const nzy = GRID_OFFSET_Y + nearest.row * CELL_H + CELL_H / 2
              this.spawnParticles((z.x + nearest.x) / 2, (zy + nzy) / 2, 2, ['#FFEB3B', '#FFF'], 20, 50, 0.2)
            } else {
              pRemoved = true
            }
          }

          if (pRemoved) { p.x = 9999; break }
        }
      }
    }
    this.projectiles = this.projectiles.filter(p => p.x < 950 && p.x > -50)

    // ── Zombie Update ──
    for (const z of this.zombies) {
      if (z.state === 'dying') {
        z.deathTimer = (z.deathTimer || 0) + dt
        if (z.deathTimer >= 0.6) z.state = 'dead'
        continue
      }
      if (z.state === 'dead') continue

      // Stun tick
      if (z.stunned) {
        z.stunTimer = (z.stunTimer || 0) - dt
        if (z.stunTimer <= 0) {
          z.stunned = false
          z.speed = z.slowed ? z.baseSpeed * 0.5 : z.baseSpeed
        }
      }

      // Slow decay
      if (z.slowed && !z.stunned) {
        z.slowTimer = (z.slowTimer || 0) - dt
        if (z.slowTimer <= 0) {
          z.slowed = false
          z.speed = z.baseSpeed
        }
      }

      // Newspaper zombie enrage
      const zCfg = ZOMBIE_CONFIGS[z.zombieType]
      if (zCfg?.enragesAt && !z.enraged && z.hp <= zCfg.enragesAt) {
        z.enraged = true
        z.speed = zCfg.enrageSpeed!
        z.baseSpeed = zCfg.enrageSpeed!
        this.spawnParticles(z.x, GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2, 8, ['#FF5722', '#F44336', '#FFF'], 40, 120, 0.5)
      }

      const plantInFront = this.plants.find(p =>
        p.row === z.row &&
        Math.abs(this.getGridCenter(p.row, p.col).x - z.x) < 28 &&
        z.x > GRID_OFFSET_X + p.col * CELL_W
      )

      if (plantInFront) {
        const pCfg = PLANT_CONFIGS[plantInFront.plantType]

        // Dispatch onContact for special plant interactions
        if (pCfg) {
          const ctx = this.createBehaviorContext(plantInFront, dt)
          for (const tag of pCfg.tags) {
            behaviorRegistry.get(tag)?.onContact?.(ctx, z)
          }
        }

        // If plant was removed by onContact, skip eating
        if (!this.plants.includes(plantInFront)) {
          z.state = 'walking'
          continue
        }

        // Pole vaulter: jump over first plant
        if (z.zombieType === 5 && !z.hasJumped) {
          z.hasJumped = true
          z.speed = 22
          z.baseSpeed = 22
          z.x = GRID_OFFSET_X + plantInFront.col * CELL_W - 20
          const { x, y } = this.getGridCenter(plantInFront.row, plantInFront.col)
          this.spawnParticles(x, y, 4, ['#8BC34A', '#FFF'], 20, 60, 0.3)
          z.state = 'walking'
          continue
        }

        z.state = 'eating'
        plantInFront.hp -= ZOMBIE_CONFIGS[z.zombieType].damage * dt
        if (Math.random() < dt * 3) {
          const { x, y } = this.getGridCenter(plantInFront.row, plantInFront.col)
          this.spawnParticles(x, y - 20, 1, ['#FF6F00', '#FFF'], 10, 30, 0.2)
        }
        if (plantInFront.hp <= 0) {
          const { x, y } = this.getGridCenter(plantInFront.row, plantInFront.col)
          this.spawnParticles(x, y, 6, ['#8D6E63', '#5D4037', '#A1887F'], 30, 100, 0.4)
          const idx = this.plants.indexOf(plantInFront)
          if (idx !== -1) this.plants.splice(idx, 1)
          eventBus.emit('plant:destroyed', { row: plantInFront.row, col: plantInFront.col, plantType: plantInFront.plantType })
          z.state = 'walking'
        }
      } else {
        z.state = 'walking'
        if (!z.stunned) {
          z.x -= z.speed * dt
        }
      }

      // Lawn mower
      if (z.x < LAWN_MOWER_X && this.lawnMowers[z.row]) {
        this.lawnMowers[z.row] = false
        this.mowersUsed++
        const mowerY = GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2
        for (let i = 0; i < 30; i++) {
          const mx = LAWN_MOWER_X + i * 20
          this.spawnParticles(mx, mowerY, 1, ['#FFF', '#E0E0E0'], 20, 50, 0.3 + Math.random() * 0.3)
        }
        for (const zz of this.zombies) {
          if (zz.row === z.row) {
            zz.state = 'dying'
            this.zombieDeathEffect(zz)
          }
        }
        eventBus.emit('mower:activated', z.row)
      }

      if (z.x < 30) {
        this.gamePhase = 'lost'
        eventBus.emit('game:phase', 'lost')
      }
    }

    // Clean up
    this.zombies = this.zombies.filter(z => z.state !== 'dead')

    // Particles
    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.gravity) p.vy += p.gravity * dt
      p.life -= dt
    }
    this.particles = this.particles.filter(p => p.life > 0)

    // Floating texts
    for (const ft of this.floatingTexts) { ft.y += ft.vy * dt; ft.life -= dt }
    this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0)

    // ── Wave system ──
    // Slow trickle: occasional lone zombie, lighter early on
    if (!this.allWavesSpawned) {
      this.trickleTimer -= dt
      if (this.trickleTimer <= 0) {
        this.trickleTimer = 12 + Math.random() * 8
        this.spawnZombie(1, Math.floor(Math.random() * 5))
      }
    }

    if (!this.allWavesSpawned) {
      const progressSpeed = 1 / (this.totalWaves * 40)
      this.waveProgress += dt * progressSpeed

      const nextWave = this.currentWave + 1
      const threshold = nextWave / this.totalWaves
      if (this.waveProgress >= threshold && nextWave <= this.totalWaves) {
        this.currentWave = nextWave
        const isFlagWave = nextWave === this.totalWaves - 1 || (this.totalWaves === 2 && nextWave === 1)
        const isFinal = nextWave === this.totalWaves
        const count = isFinal ? 10 : isFlagWave ? 8 : 3 + nextWave
        const types = isFinal ? [1, 1, 2] : isFlagWave ? [1, 1, 2, 3] : nextWave <= 2 ? [1] : [1, 1, 2]
        for (let i = 0; i < count; i++) {
          this.spawnQueue.push({
            type: types[Math.floor(Math.random() * types.length)],
            row: Math.floor(Math.random() * 5),
          })
        }
        eventBus.emit('wave:updated', this.currentWave, this.totalWaves)
        if (isFlagWave) eventBus.emit('ui:huge_wave', this.currentWave)
        if (isFinal) this.allWavesSpawned = true
      }
    }

    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt
      if (this.spawnTimer <= 0) {
        const entry = this.spawnQueue.shift()!
        this.spawnZombie(entry.type, entry.row)
        this.spawnTimer = this.spawnInterval
      }
    }

    // Win condition
    if (this.allWavesSpawned && this.spawnQueue.length === 0) {
      const aliveZombies = this.zombies.filter(z => z.state !== 'dying' && z.state !== 'dead').length
      if (aliveZombies === 0) {
        this.gamePhase = 'won'
        this.endStars = this.mowersUsed === 0 ? 3 : this.mowersUsed <= 2 ? 2 : 1
        this.endCoins = 30 + this.endStars * 10
        eventBus.emit('game:phase', 'won')
        eventBus.emit('game:end_stats', { stars: this.endStars, coins: this.endCoins, mowersUsed: this.mowersUsed })
      }
    }

    eventBus.emit('state:updated', {
      plants: this.plants,
      zombies: this.zombies,
      projectiles: this.projectiles,
      sunDrops: this.sunDrops,
      sun: this.sun,
      gameTime: this.gameTime,
      cooldowns: { ...this.plantCooldowns },
      waveProgress: this.waveProgress,
      currentWave: this.currentWave,
      totalWaves: this.totalWaves,
    })
  }

  destroy() {
    eventBus.clear()
  }
}
