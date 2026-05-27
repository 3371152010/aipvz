<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { GameEngine } from '../../engine/GameEngine'
import { eventBus } from '../../engine/EventBus'
import { gridToPixel, pixelToGrid, getZombieRect, getPlantRect, getSunRect } from '../../engine/Collision'
import {
  PLANT_CONFIGS, ZOMBIE_CONFIGS, CELL_W, CELL_H,
  GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS, GRID_ROWS,
  LAWN_MOWER_X,
} from '../../engine/constants'
import type { PlacedPlant, ActiveZombie, Projectile } from '../../types/game'
import type { SunDrop } from '../../engine/GameEngine'
import { useGameStore } from '../../stores/game'

const props = defineProps<{ world: number; level: number; unlockedPlants: number[]; isNight?: boolean; hasPool?: boolean }>()
const emit = defineEmits<{ back: [] }>()
const router = useRouter()
const gameStore = useGameStore()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

let engine: GameEngine
let animFrameId = 0
let gameEndReported = false
let plantCards = ref<number[]>(props.unlockedPlants.length > 0 ? props.unlockedPlants : [1, 2])
let sun = ref(200)
let gamePhase = ref<string>('preparing')
let currentWave = ref(0)
let totalWaves = ref(2)
let gameTime = ref(0)
let hugeWaveText = ref('')
let hugeWaveTimer = 0
let cooldowns = ref<Record<number, number>>({})
let waveProgress = ref(0)
let waveCurrent = ref(0)
let waveTotal = ref(2)
let endStars = ref(0)
let endCoins = ref(0)
let showEndOverlay = ref(false)

onMounted(() => {
  engine = new GameEngine()
  const wavesMap: Record<number, number> = { 1: 2, 2: 3, 3: 4 }
  engine.configure({
    isNight: props.isNight || false,
    hasPool: props.hasPool || false,
    totalWaves: wavesMap[props.world] || 2,
  })
  totalWaves.value = engine.totalWaves
  waveTotal.value = engine.totalWaves

  eventBus.on('sun:updated', (s: number) => { sun.value = s })
  eventBus.on('wave:updated', (w: number, t: number) => { currentWave.value = w; totalWaves.value = t })
  eventBus.on('game:phase', (p: string) => {
    gamePhase.value = p
    if ((p === 'won' || p === 'lost') && !gameEndReported) {
      gameEndReported = true
      gameStore.endLevel(p === 'won', engine.mowersUsed, engine.endStars).then(() => gameStore.syncUserResources())
    }
  })
  eventBus.on('game:end_stats', (s: { stars: number; coins: number; mowersUsed: number }) => {
    endStars.value = s.stars
    endCoins.value = s.coins
    showEndOverlay.value = true
  })
  eventBus.on('state:updated', (s: any) => { sun.value = s.sun; gameTime.value = s.gameTime; cooldowns.value = s.cooldowns || {}; waveProgress.value = s.waveProgress || 0; waveCurrent.value = s.currentWave || 0; waveTotal.value = s.totalWaves || 2 })
  eventBus.on('plant:destroyed', () => { gameStore.incrementPlantsLost() })
  eventBus.on('plant:placed', (p: any) => { gameStore.recordPlantUsed(p.plantType) })
  eventBus.on('ui:huge_wave', (w: number) => {
    hugeWaveText.value = `⚡ 大波僵尸来袭! (第${w}波)`
    hugeWaveTimer = 3
  })

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  animFrameId = requestAnimationFrame(gameLoop)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  cancelAnimationFrame(animFrameId)
  engine?.destroy()
})

function resizeCanvas() {
  const container = containerRef.value
  const canvas = canvasRef.value
  if (!container || !canvas) return
  const w = container.clientWidth
  const h = container.clientHeight
  canvas.width = w
  canvas.height = h
}

let lastTime = 0

function gameLoop(ts: number) {
  const dt = lastTime ? Math.min((ts - lastTime) / 1000, 0.05) : 0.016
  lastTime = ts

  engine.update(dt)

  if (hugeWaveTimer > 0) {
    hugeWaveTimer -= dt
    if (hugeWaveTimer <= 0) hugeWaveText.value = ''
  }

  render()
  animFrameId = requestAnimationFrame(gameLoop)
}

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const cw = canvas.width
  const ch = canvas.height
  const scaleX = cw / 900
  const scaleY = ch / 600
  const scale = Math.min(scaleX, scaleY)

  ctx.save()
  ctx.clearRect(0, 0, cw, ch)

  const offX = (cw - 900 * scale) / 2
  const offY = (ch - 600 * scale) / 2
  ctx.translate(offX, offY)
  ctx.scale(scale, scale)

  // Sky
  if (props.isNight) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 150)
    skyGrad.addColorStop(0, '#0D0221')
    skyGrad.addColorStop(0.5, '#1A0A3E')
    skyGrad.addColorStop(1, '#2D1B4E')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, 900, 150)
    // Stars
    ctx.fillStyle = '#FFF'
    const starSeed = [23,67,112,189,245,312,378,445,512,589,634,701,768,823,45,156,267,398,489,567,678,723,845]
    for (const sx of starSeed) {
      const sy = 10 + (sx * 73) % 130
      const sr = 0.5 + (sx % 3) * 0.5
      ctx.globalAlpha = 0.3 + (sx % 5) * 0.15
      ctx.beginPath()
      ctx.arc(sx % 900, sy, sr, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    // Moon
    ctx.fillStyle = '#FFFDE7'
    ctx.beginPath()
    ctx.arc(780, 40, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0D0221'
    ctx.beginPath()
    ctx.arc(792, 34, 26, 0, Math.PI * 2)
    ctx.fill()
  } else {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 150)
    skyGrad.addColorStop(0, '#64B5F6')
    skyGrad.addColorStop(1, '#A5D6A7')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, 900, 150)
  }

  // Ground
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(0, 150, 900, 450)

  // Pool water rows (world 3: rows 2 and 3)
  if (props.hasPool) {
    const poolY = GRID_OFFSET_Y + 2 * CELL_H
    const poolH = CELL_H * 2
    const poolGrad = ctx.createLinearGradient(0, poolY, 0, poolY + poolH)
    poolGrad.addColorStop(0, '#1565C0')
    poolGrad.addColorStop(0.5, '#1976D2')
    poolGrad.addColorStop(1, '#0D47A1')
    ctx.fillStyle = poolGrad
    ctx.fillRect(0, poolY, 900, poolH)
    // Water shimmer lines
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1
    for (let i = 0; i < 6; i++) {
      const wy = poolY + i * (poolH / 6) + (Date.now() / 3000 + i) % (poolH / 6)
      ctx.beginPath()
      ctx.moveTo(0, wy)
      for (let x = 0; x < 900; x += 30) {
        ctx.lineTo(x, wy + Math.sin(x * 0.02 + i) * 4)
      }
      ctx.stroke()
    }
  }

  // Grass grid
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const x = GRID_OFFSET_X + c * CELL_W
      const y = GRID_OFFSET_Y + r * CELL_H
      const isWaterCell = props.hasPool && (r === 2 || r === 3)
      if (isWaterCell) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1976D2' : '#1565C0'
      } else {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#66BB6A' : '#4CAF50'
      }
      ctx.fillRect(x, y, CELL_W, CELL_H)
      ctx.strokeStyle = 'rgba(0,0,0,0.1)'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, CELL_W, CELL_H)
    }
  }

  // Cratered cells (Doom-shroom)
  for (const key of engine.craters) {
    const [cr, cc] = key.split(',').map(Number)
    const cx = GRID_OFFSET_X + cc * CELL_W
    const cy = GRID_OFFSET_Y + cr * CELL_H
    ctx.fillStyle = '#2D1B0E'
    ctx.fillRect(cx + 4, cy + 4, CELL_W - 8, CELL_H - 8)
    // Crack lines
    ctx.strokeStyle = '#1A0A00'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx + 10, cy + 10)
    ctx.lineTo(cx + 30, cy + 35)
    ctx.moveTo(cx + 50, cy + 15)
    ctx.lineTo(cx + 25, cy + 50)
    ctx.moveTo(cx + 15, cy + 70)
    ctx.lineTo(cx + 40, cy + 60)
    ctx.moveTo(cx + 55, cy + 45)
    ctx.lineTo(cx + 65, cy + 25)
    ctx.stroke()
  }

  // Lawn mowers
  for (let r = 0; r < GRID_ROWS; r++) {
    if (!engine.lawnMowers[r]) continue
    const y = GRID_OFFSET_Y + r * CELL_H + CELL_H / 2
    ctx.fillStyle = '#E53935'
    ctx.fillRect(5, y - 12, 35, 24)
    ctx.fillStyle = '#FFF'
    ctx.fillRect(8, y - 8, 12, 8)
    ctx.fillRect(8, y + 2, 12, 8)
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(25, y + 6, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(25, y - 6, 6, 0, Math.PI * 2)
    ctx.fill()
  }

  // Sun drops
  for (const s of engine.sunDrops) {
    if (s.collected) {
      // Shrinking + fading
      const progress = s.collectProgress || 0
      ctx.globalAlpha = 1 - progress
      const r = 15 * (1 - progress * 0.5)
      ctx.fillStyle = '#FFD600'
      ctx.beginPath()
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // Normal sun
      ctx.fillStyle = '#FFD600'
      ctx.beginPath()
      ctx.arc(s.x, s.y, 15, 0, Math.PI * 2)
      ctx.fill()
      // Glow
      ctx.shadowColor = '#FFD600'
      ctx.shadowBlur = 8
      ctx.fillStyle = '#FFAB00'
      ctx.beginPath()
      ctx.arc(s.x, s.y, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#FFF'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('☀', s.x, s.y + 4)
    }
  }

  // Sun fly-to-counter particles
  for (const fp of engine.sunFlyParts) {
    const progress = 1 - fp.life / fp.maxLife
    const cx = fp.x + (fp.targetX - fp.x) * progress
    const cy = fp.y + (fp.targetY - fp.y) * progress - Math.sin(progress * Math.PI) * 60
    ctx.globalAlpha = 1 - progress
    ctx.fillStyle = '#FFD600'
    ctx.shadowColor = '#FFAB00'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(cx, cy, 6 * (1 - progress * 0.6), 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }
  ctx.globalAlpha = 1

  // Plants
  for (const plant of engine.plants) {
    const { x, y } = gridToPixel(plant.row, plant.col)
    const cfg = PLANT_CONFIGS[plant.plantType]
    if (!cfg) continue
    const tags = cfg.tags
    const maxHp = cfg.maxHp || cfg.hp

    // ── Tag-based rendering ──
    if (tags.includes('spikeweed')) {
      // Spikeweed / Spikerock: flat with spikes
      ctx.fillStyle = cfg.color
      ctx.fillRect(x - 28, y + 8, 56, tags.includes('spikeweed') && plant.plantType >= 114 ? 12 : 8)
      const spikeCount = plant.plantType >= 114 ? 5 : 7
      for (let s = -Math.floor(spikeCount/2); s <= Math.floor(spikeCount/2); s++) {
        ctx.beginPath()
        ctx.moveTo(x + s * 8, y + 8)
        ctx.lineTo(x + s * 8 - 2, y - 4)
        ctx.lineTo(x + s * 8 + 2, y - 4)
        ctx.fill()
      }
    } else if (tags.includes('eater')) {
      // Chomper: big purple mouth
      ctx.fillStyle = cfg.color
      ctx.beginPath()
      ctx.arc(x, y - 8, 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#4A148C'
      ctx.beginPath()
      ctx.ellipse(x, y + 2, 14, 8, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#D50000'
      ctx.beginPath()
      ctx.ellipse(x, y + 4, 10, 4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FFF'
      ctx.beginPath(); ctx.arc(x - 7, y - 14, 5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + 7, y - 14, 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#333'
      ctx.beginPath(); ctx.arc(x - 7, y - 14, 2, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + 7, y - 14, 2, 0, Math.PI * 2); ctx.fill()
    } else if (tags.includes('wall') || tags.includes('wall_regen') || tags.includes('wall_knockback') || tags.includes('hot_date')) {
      // Wall / Tall-nut / Infi-nut / Sweet Potato / Hot Date: barrier
      const wallH = cfg.hp > 5000 ? 55 : cfg.hp > 3000 ? 50 : 45
      const wallW = cfg.hp > 5000 ? 40 : 36
      ctx.fillStyle = cfg.color
      ctx.beginPath()
      ctx.roundRect(x - wallW/2, y - wallH, wallW, wallH, 6)
      ctx.fill()
      ctx.strokeStyle = '#5D4037'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(x - wallW/2, y - wallH, wallW, wallH, 6)
      ctx.stroke()
      // Eyes
      ctx.fillStyle = '#FFF'
      ctx.beginPath(); ctx.arc(x - 6, y - wallH + 18, 6, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + 6, y - wallH + 18, 6, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#333'
      ctx.beginPath(); ctx.arc(x - 6, y - wallH + 18, 3, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + 6, y - wallH + 18, 3, 0, Math.PI * 2); ctx.fill()
      // Regen glow for infi-nut
      if (tags.includes('wall_regen') && !plant.hasRegenerated) {
        ctx.fillStyle = 'rgba(33,150,243,0.3)'
        ctx.beginPath()
        ctx.roundRect(x - wallW/2 - 3, y - wallH - 3, wallW + 6, wallH + 6, 8)
        ctx.fill()
      }
    } else if (tags.includes('launcher')) {
      // Cob Cannon / Coconut Cannon / Banana Launcher: wide base with barrel
      ctx.fillStyle = cfg.color
      ctx.fillRect(x - 26, y - 20, 52, 30)
      // Barrel
      ctx.fillStyle = '#5D4037'
      ctx.fillRect(x + 6, y - 38, 16, 22)
      ctx.fillStyle = '#3E2723'
      ctx.fillRect(x + 8, y - 44, 12, 8)
      // Eyes
      ctx.fillStyle = '#FFF'
      ctx.beginPath(); ctx.arc(x - 8, y - 10, 5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + 8, y - 10, 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#333'
      ctx.beginPath(); ctx.arc(x - 8, y - 10, 2, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + 8, y - 10, 2, 0, Math.PI * 2); ctx.fill()
    } else {
      // Check for mushroom type: dome cap + stem
      const isMushroom = tags.includes('piercing') || tags.includes('radial_aoe') ||
        tags.includes('sun_producer_growing') || tags.includes('instant_freeze') ||
        tags.includes('magnet') || (plant.plantType === 12 || plant.plantType === 13 ||
        plant.plantType === 15 || plant.plantType === 27 || plant.plantType === 107 ||
        plant.plantType === 108 || plant.plantType === 113)

      if (isMushroom) {
        // Mushroom: dome cap
        ctx.fillStyle = cfg.color
        ctx.beginPath()
        ctx.arc(x, y - 12, 20, Math.PI, 0)
        ctx.fill()
        // Stem
        ctx.fillStyle = '#D7CCC8'
        ctx.fillRect(x - 8, y - 8, 16, 14)
        // Eyes
        ctx.fillStyle = '#FFF'
        ctx.beginPath(); ctx.arc(x - 6, y - 10, 5, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(x + 6, y - 10, 5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#333'
        ctx.beginPath(); ctx.arc(x - 6, y - 10, 2, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(x + 6, y - 10, 2, 0, Math.PI * 2); ctx.fill()
        // Light glow for plantern
        if (tags.includes('light')) {
          ctx.fillStyle = 'rgba(255,235,59,0.3)'
          ctx.beginPath()
          ctx.arc(x, y - 5, 30, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (tags.includes('lobber')) {
        // Lobber: circle body + throwing arm
        ctx.fillStyle = cfg.color
        ctx.beginPath()
        ctx.arc(x, y - 10, 22, 0, Math.PI * 2)
        ctx.fill()
        // Throwing arm
        ctx.strokeStyle = cfg.color
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(x + 10, y - 20, 10, -Math.PI/3, Math.PI/2)
        ctx.stroke()
        ctx.lineWidth = 1
        // Eyes
        ctx.fillStyle = '#FFF'
        ctx.beginPath(); ctx.arc(x - 6, y - 15, 6, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(x + 6, y - 15, 6, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#333'
        ctx.beginPath(); ctx.arc(x - 6, y - 15, 3, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(x + 6, y - 15, 3, 0, Math.PI * 2); ctx.fill()
        // Watermelon: larger
        if (cfg.cost >= 325) {
          ctx.fillStyle = cfg.color
          ctx.beginPath()
          ctx.arc(x, y - 12, 24, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (tags.includes('water_trap') || cfg.aquatic) {
        // Aquatic: lily pad base + plant
        ctx.fillStyle = '#00695C'
        ctx.beginPath()
        ctx.ellipse(x, y + 10, 24, 10, 0, 0, Math.PI * 2)
        ctx.fill()
        // Plant body on top
        ctx.fillStyle = cfg.color
        ctx.beginPath()
        ctx.arc(x, y - 10, 18, 0, Math.PI * 2)
        ctx.fill()
        // Eyes
        ctx.fillStyle = '#FFF'
        ctx.beginPath(); ctx.arc(x - 5, y - 14, 5, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(x + 5, y - 14, 5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#333'
        ctx.beginPath(); ctx.arc(x - 5, y - 14, 2, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(x + 5, y - 14, 2, 0, Math.PI * 2); ctx.fill()
      } else {
        // Standard: circle body + face + emoji
        ctx.fillStyle = cfg.color
        ctx.beginPath()
        ctx.arc(x, y - 10, 22, 0, Math.PI * 2)
        ctx.fill()

        // Eyes
        ctx.fillStyle = '#FFF'
        ctx.beginPath(); ctx.arc(x - 6, y - 15, 6, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(x + 6, y - 15, 6, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#333'
        ctx.beginPath(); ctx.arc(x - 6, y - 15, 3, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(x + 6, y - 15, 3, 0, Math.PI * 2); ctx.fill()

        // Emoji decoration
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(cfg.emoji, x, y - 24)

        // Special indicators
        if (tags.includes('slow')) {
          ctx.fillStyle = '#B3E5FC'
          ctx.beginPath()
          ctx.moveTo(x, y - 35); ctx.lineTo(x - 8, y - 22); ctx.lineTo(x + 8, y - 22)
          ctx.fill()
        }
        if (cfg.projectileCount && cfg.projectileCount >= 2) {
          ctx.fillStyle = '#1B5E20'
          for (let b = 0; b < Math.min(cfg.projectileCount, 4); b++) {
            ctx.fillRect(x + 10, y - 20 + b * 6, 6, 3)
          }
        }
        if (tags.includes('pushback')) {
          ctx.fillStyle = '#8D6E63'
          ctx.fillRect(x - 3, y - 36, 6, 6)
        }
      }
    }

    // Health bar if damaged
    if (plant.hp < maxHp) {
      const barW = 40
      const barY = tags.includes('spikeweed') ? y : y - 40
      ctx.fillStyle = '#F44336'
      ctx.fillRect(x - barW / 2, barY, barW, 4)
      ctx.fillStyle = '#4CAF50'
      ctx.fillRect(x - barW / 2, barY, barW * (plant.hp / maxHp), 4)
    }

    // Mine: red dot when unarmed
    if (tags.includes('mine') && !plant.armed) {
      ctx.fillStyle = '#E53935'
      ctx.beginPath()
      ctx.arc(x, y - 5, 8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Projectiles
  for (const p of engine.projectiles) {
    ctx.fillStyle = p.slow ? '#64B5F6' : '#4CAF50'
    ctx.beginPath()
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Zombies
  for (const z of engine.zombies) {
    const cfg = ZOMBIE_CONFIGS[z.zombieType]
    if (!cfg) continue
    const baseY = GRID_OFFSET_Y + z.row * CELL_H + CELL_H / 2

    if (z.state === 'dying') {
      const progress = (z.deathTimer || 0) / 0.6
      ctx.globalAlpha = 1 - progress
      ctx.fillStyle = '#666'
      ctx.fillRect(z.x - 12, baseY - 35, 24, 70)
      ctx.globalAlpha = 1
      continue
    }

    // Body
    if (z.zombieType === 7) {
      // Football zombie: bulky
      ctx.fillStyle = cfg.color
      ctx.fillRect(z.x - 16, baseY - 40, 32, 60)
      // Helmet
      ctx.fillStyle = '#0D47A1'
      ctx.beginPath()
      ctx.arc(z.x, baseY - 42, 14, Math.PI, 0)
      ctx.fill()
      ctx.fillStyle = '#B71C1C'
      ctx.fillRect(z.x - 6, baseY - 48, 12, 4)
    } else if (z.zombieType === 5) {
      // Pole vaulter: slim with pole
      ctx.fillStyle = cfg.color
      ctx.fillRect(z.x - 10, baseY - 35, 20, 50)
      if (!z.hasJumped) {
        ctx.strokeStyle = '#795548'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(z.x + 10, baseY + 20)
        ctx.lineTo(z.x + 10, baseY - 60)
        ctx.stroke()
        ctx.lineWidth = 1
      }
    } else if (z.zombieType === 8) {
      // Dancing zombie: fancy colors
      ctx.fillStyle = cfg.color
      ctx.fillRect(z.x - 12, baseY - 35, 24, 50)
      // Disco ball / sparkle
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(z.x + 14, baseY - 50, 6, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = cfg.color
      ctx.fillRect(z.x - 12, baseY - 35, 24, 50)
    }

    // Head accessories
    if (z.zombieType === 2) {
      ctx.fillStyle = '#FF9800'
      ctx.beginPath()
      ctx.arc(z.x, baseY - 40, 14, Math.PI, 0)
      ctx.fill()
    }
    if (z.zombieType === 3) {
      ctx.fillStyle = '#78909C'
      ctx.fillRect(z.x - 10, baseY - 45, 20, 16)
      ctx.fillStyle = '#546E7A'
      ctx.fillRect(z.x - 6, baseY - 42, 12, 10)
    }
    if (z.zombieType === 4) {
      // Flag zombie: holds a flag
      ctx.fillStyle = '#E53935'
      ctx.fillRect(z.x + 12, baseY - 60, 2, 30)
      ctx.fillRect(z.x + 14, baseY - 60, 10, 8)
    }
    if (z.zombieType === 6 && !z.enraged) {
      // Newspaper zombie: holds newspaper
      ctx.fillStyle = '#FFF9C4'
      ctx.fillRect(z.x - 6, baseY - 10, 14, 18)
      ctx.fillStyle = '#333'
      ctx.font = '6px sans-serif'
      ctx.fillText('NEWS', z.x - 10, baseY)
    }

    // Head
    ctx.fillStyle = '#A5D6A7'
    ctx.beginPath()
    ctx.arc(z.x, baseY - 35, 10, 0, Math.PI * 2)
    ctx.fill()

    // Legs
    ctx.fillStyle = z.enraged ? '#E53935' : '#795548'
    ctx.fillRect(z.x - 8, baseY + 15, 6, 15)
    ctx.fillRect(z.x + 2, baseY + 15, 6, 15)

    // Health bar
    const barW = 30
    ctx.fillStyle = '#F44336'
    ctx.fillRect(z.x - barW / 2, baseY - 50, barW, 3)
    ctx.fillStyle = '#4CAF50'
    ctx.fillRect(z.x - barW / 2, baseY - 50, barW * (z.hp / z.maxHp), 3)

    // Eating indicator
    if (z.state === 'eating') {
      ctx.fillStyle = '#FF6F00'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('啃!', z.x, baseY - 55)
    }
  }

  // Particles with glow
  for (const p of engine.particles) {
    const alpha = p.life / p.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = 4
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * (0.5 + alpha * 0.5), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1

  // Floating texts (coin drops, etc)
  for (const ft of engine.floatingTexts) {
    const alpha = Math.min(ft.life / 0.3, 1)
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ft.text, ft.x, ft.y)
  }
  ctx.globalAlpha = 1

  // Huge wave overlay
  if (hugeWaveTimer > 0) {
    ctx.fillStyle = `rgba(255,0,0,${Math.min(hugeWaveTimer, 1) * 0.3})`
    ctx.fillRect(0, 0, 900, 600)
  }

  ctx.restore()
}

function handleClick(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const cw = canvas.width
  const ch = canvas.height
  const scale = Math.min(cw / 900, ch / 600)
  const offX = (cw - 900 * scale) / 2
  const offY = (ch - 600 * scale) / 2
  const canvasX = (e.clientX - rect.left) * (cw / rect.width)
  const canvasY = (e.clientY - rect.top) * (ch / rect.height)
  const mx = (canvasX - offX) / scale
  const my = (canvasY - offY) / scale

  if (gamePhase.value === 'preparing') {
    engine.startGame()
    return
  }

  if (gamePhase.value !== 'playing') return

  const grid = pixelToGrid(mx, my)
  if (grid) {
    eventBus.emit('grid:click', grid.row, grid.col)
  }
}

function selectPlant(type: number) {
  if (engine?.selectedPlantType === type) {
    eventBus.emit('plant:select', null)
  } else {
    eventBus.emit('plant:select', type)
  }
}

function selectShovel() {
  eventBus.emit('tool:select', 'shovel')
}

function togglePause() {
  if (gamePhase.value === 'playing') eventBus.emit('game:pause')
  else if (gamePhase.value === 'paused') eventBus.emit('game:resume')
}
</script>

<template>
  <div ref="containerRef" class="w-full h-full relative bg-black select-none">
    <canvas ref="canvasRef" class="absolute inset-0 cursor-crosshair" @click="handleClick" />

    <!-- Top bar HUD -->
    <div class="absolute top-2 left-0 right-0 flex justify-between items-center px-4 z-10 pointer-events-none">
      <div class="flex items-center gap-3 pointer-events-auto">
        <div class="bg-black/70 rounded-lg px-3 py-1.5 text-yellow-400 font-bold text-lg flex items-center gap-1">
          <span>☀️</span>
          <span>{{ sun }}</span>
        </div>
        <div class="bg-black/70 rounded-lg px-3 py-1.5 text-white text-sm">
          波次 {{ currentWave }}/{{ totalWaves }}
        </div>
        <div class="bg-black/70 rounded-lg px-3 py-1.5 text-green-300 text-sm">
          {{ gamePhase === 'preparing' ? '点击草地开始' : gamePhase === 'won' ? '🎉 胜利!' : gamePhase === 'lost' ? '💀 失败' : gamePhase === 'paused' ? '⏸ 暂停' : '' }}
        </div>
      </div>
      <div class="flex gap-2 pointer-events-auto">
        <n-button v-if="gamePhase === 'playing' || gamePhase === 'paused'" size="tiny" @click="togglePause">
          {{ gamePhase === 'paused' ? '继续' : '暂停' }}
        </n-button>
        <n-button size="tiny" type="error" @click="emit('back')">退出</n-button>
      </div>
    </div>

    <!-- Wave progress bar -->
    <div v-if="gamePhase === 'playing' || gamePhase === 'paused'" class="absolute top-14 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
      <div class="bg-black/50 rounded-full h-4 w-64 overflow-hidden border border-gray-600 relative">
        <div class="absolute inset-0 flex items-center">
          <div
            v-for="w in waveTotal"
            :key="'f'+w"
            class="absolute w-px h-full bg-yellow-400/70"
            :style="{ left: (w / waveTotal * 100) + '%' }"
          />
        </div>
        <div
          class="h-full bg-gradient-to-r from-green-600 to-red-500 rounded-full transition-all duration-300"
          :style="{ width: Math.min(waveProgress * 100, 100) + '%' }"
        />
        <div
          class="absolute top-0 -translate-x-1/2 text-yellow-300 text-xs"
          :style="{ left: Math.min(waveProgress * 100, 100) + '%' }"
        >🚩</div>
      </div>
      <span class="text-white text-xs bg-black/50 px-2 py-0.5 rounded">{{ waveCurrent }}/{{ waveTotal }}</span>
    </div>
    <div v-if="hugeWaveText" class="absolute top-1/3 left-1/2 -translate-x-1/2 z-20 pointer-events-none
      bg-red-600/80 text-white text-2xl font-bold px-6 py-3 rounded-lg animate-pulse">
      {{ hugeWaveText }}
    </div>

    <!-- End game overlay -->
    <div v-if="showEndOverlay && gamePhase === 'won'" class="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
      <div class="bg-green-900/95 border-2 border-yellow-400 rounded-2xl p-8 text-center min-w-300px">
        <h2 class="text-3xl font-bold text-yellow-400 mb-4">🎉 胜利!</h2>
        <div class="flex justify-center gap-1 mb-4">
          <span v-for="i in 3" :key="i" class="text-4xl" :class="i <= endStars ? '' : 'opacity-20'">⭐</span>
        </div>
        <div class="text-yellow-400 text-xl font-bold mb-6">
          💵 +{{ endCoins }} 金币
        </div>
        <n-button type="success" size="large" @click="emit('back')">返回关卡</n-button>
      </div>
    </div>

    <div v-if="showEndOverlay && gamePhase === 'lost'" class="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
      <div class="bg-red-900/95 border-2 border-red-400 rounded-2xl p-8 text-center min-w-300px">
        <h2 class="text-3xl font-bold text-red-400 mb-4">💀 失败</h2>
        <div class="text-gray-400 text-lg mb-6">
          僵尸入侵了你的家园...
        </div>
        <n-button type="error" size="large" @click="emit('back')">返回关卡</n-button>
      </div>
    </div>

    <!-- Plant selection bar -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-[90vw]">
      <div class="flex gap-2 items-end bg-black/50 backdrop-blur rounded-xl p-3 overflow-x-auto">
        <div
          v-for="type in plantCards"
          :key="type"
          class="w-14 h-18 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all border-2 relative overflow-hidden flex-shrink-0"
          :class="engine?.selectedPlantType === type ? 'border-yellow-400 bg-green-800 scale-110' : (cooldowns[type] || 0) > 0 ? 'border-gray-500 bg-green-900/40 opacity-50 cursor-not-allowed' : 'border-gray-600 bg-green-900/80 hover:border-green-400'"
          @click="selectPlant(type)"
        >
          <div class="text-lg">{{ PLANT_CONFIGS[type]?.emoji || '🌱' }}</div>
          <div class="text-yellow-400 text-xs font-bold">{{ PLANT_CONFIGS[type]?.cost }}☀</div>
          <div class="text-white text-2xs truncate w-full text-center">{{ PLANT_CONFIGS[type]?.name.slice(0,2) }}</div>
          <div
            v-if="(cooldowns[type] || 0) > 0"
            class="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg"
          >
            <span class="text-white font-bold text-sm">{{ Math.ceil(cooldowns[type]) }}s</span>
          </div>
        </div>

        <div class="w-px h-16 bg-gray-500 mx-1 flex-shrink-0" />

        <div
          class="w-14 h-18 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all border-2 flex-shrink-0"
          :class="engine?.selectedTool === 'shovel' ? 'border-yellow-400 bg-green-800 scale-110' : 'border-gray-600 bg-green-900/80 hover:border-green-400'"
          @click="selectShovel"
        >
          <div class="text-lg">🔧</div>
          <div class="text-white text-xs">铲除</div>
        </div>
      </div>
    </div>

    <!-- Win/Lose modal -->
    <div v-if="gamePhase === 'won' || gamePhase === 'lost'" class="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
      <div class="bg-green-900 rounded-2xl p-8 text-center border-2 border-green-500">
        <div class="text-6xl mb-4">{{ gamePhase === 'won' ? '🏆' : '💀' }}</div>
        <h2 class="text-3xl font-bold text-white mb-2">{{ gamePhase === 'won' ? '恭喜通关!' : '任务失败' }}</h2>
        <p class="text-green-300 mb-6">世界 {{ props.world }} 关卡 {{ props.level }}</p>
        <div class="flex gap-3 justify-center">
          <n-button v-if="gamePhase === 'won'" type="success" size="large" @click="emit('back')">
            返回关卡选择
          </n-button>
          <n-button v-else size="large" @click="emit('back')">
            重新挑战
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>
