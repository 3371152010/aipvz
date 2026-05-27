<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getUserInventory } from '../api/user'
import { PLANT_CONFIGS, type BehaviorTag } from '../engine/constants'

const router = useRouter()
const auth = useAuthStore()

const ownedPlantIds = ref<number[]>([])

onMounted(async () => {
  if (!auth.isLoggedIn) return
  try {
    const { data } = await getUserInventory()
    if (data?.data?.plants) {
      ownedPlantIds.value = data.data.plants.map((p: any) => p.plantId)
    }
  } catch { /* ignore */ }
})

function isOwned(plantId: number): boolean {
  return ownedPlantIds.value.includes(plantId)
}

const commonPlants = computed(() =>
  Object.entries(PLANT_CONFIGS)
    .filter(([id, _]) => Number(id) >= 1 && Number(id) <= 30)
    .map(([id, cfg]) => ({ id: Number(id), ...cfg }))
    .sort((a, b) => a.id - b.id)
)

const rarePlants = computed(() =>
  Object.entries(PLANT_CONFIGS)
    .filter(([id, _]) => Number(id) >= 101 && Number(id) <= 120)
    .map(([id, cfg]) => ({ id: Number(id), ...cfg }))
    .sort((a, b) => a.id - b.id)
)

const TAG_DESC: Record<BehaviorTag, string> = {
  shooter: '朝前方直线发射子弹',
  three_way: '同时攻击自身行及上下两行',
  lobber: '投掷弧线攻击，可越过障碍物',
  piercing: '子弹穿透所有经过的僵尸',
  tracking: '自动追踪最近的僵尸',
  boomerang: '子弹飞去飞回，可命中两次',
  cone_aoe: '对前方锥形范围造成伤害',
  chain_aoe: '闪电链跳跃攻击多个僵尸',
  radial_aoe: '攻击周围3x3范围',
  bonk_choy: '快速近战连击',
  sun_producer: '定期生产阳光',
  sun_producer_growing: '随时间成长，生产更多阳光',
  wall: '高生命值，阻挡僵尸前进',
  wall_regen: '被摧毁后可再生',
  wall_knockback: '将前方僵尸击退',
  mine: '埋入地下后爆炸，造成大范围伤害',
  spikeweed: '对踩踏的僵尸持续造成伤害',
  water_trap: '将水中僵尸拖入水底秒杀',
  eater: '吞噬一个僵尸，需时间消化',
  instant_3x3: '放置瞬间对3x3范围造成巨大伤害',
  instant_row: '放置瞬间清除整行僵尸',
  instant_freeze: '放置瞬间冻结全屏僵尸',
  launcher: '发射导弹轰炸目标区域',
  magnet: '吸取僵尸的铁质防具',
  light: '驱散迷雾，揭示隐藏僵尸',
  avocado: '近战攻击后冲锋穿行',
  celery: '潜伏在僵尸背后发动致命一击',
  ghost_pepper: '恐惧周围僵尸后自爆',
  hot_date: '吸引僵尸后自爆',
  spore: '击杀僵尸后在原地生成新植物',
  pushback: '子弹命中时击退僵尸',
  slow: '子弹命中时减速僵尸',
  balloon_pop: '可击落气球僵尸',
  butter: '概率造成眩晕',
}

function getTagDesc(tag: BehaviorTag): string {
  return TAG_DESC[tag] || tag
}

function getRarityBadge(rarity: string) {
  return rarity === 'rare' ? '稀有' : '普通'
}

function getRarityClass(rarity: string) {
  return rarity === 'rare'
    ? 'bg-purple-600/40 text-purple-300 border-purple-500/30'
    : 'bg-green-600/40 text-green-300 border-green-500/30'
}

const statFields = [
  { key: 'hp', label: '❤️ 生命', class: 'text-white', fmt: (v: number) => v },
  { key: 'damage', label: '⚔️ 伤害', class: 'text-red-400', fmt: (v: number) => v || '-' },
  { key: 'cost', label: '☀️ 阳光', class: 'text-yellow-400', fmt: (v: number) => v },
  { key: 'cooldown', label: '⏱ CD', class: 'text-blue-300', fmt: (v: number) => v + 's' },
] as const

function getExtraStats(plant: any) {
  const stats: { label: string; value: string; color: string }[] = []
  if (plant.attackInterval > 0) stats.push({ label: '🔄 间隔', value: plant.attackInterval + 's', color: 'text-cyan-300' })
  if (plant.sunAmount) stats.push({ label: '☀️ 产阳', value: String(plant.sunAmount), color: 'text-yellow-300' })
  if (plant.projectileCount) stats.push({ label: '🔫 连发', value: String(plant.projectileCount), color: 'text-orange-300' })
  if (plant.splashRadius) stats.push({ label: '💥 溅射', value: String(plant.splashRadius), color: 'text-orange-300' })
  if (plant.slowAmount) stats.push({ label: '🧊 减速', value: Math.round((1 - plant.slowAmount) * 100) + '%', color: 'text-blue-300' })
  if (plant.pushback) stats.push({ label: '💨 击退', value: plant.pushback + 'px', color: 'text-amber-300' })
  if (plant.stunChance) stats.push({ label: '🧈 眩晕', value: Math.round(plant.stunChance * 100) + '%', color: 'text-yellow-300' })
  if (plant.stunDuration) stats.push({ label: '⏳ 眩晕时长', value: plant.stunDuration + 's', color: 'text-yellow-300' })
  if (plant.chainCount) stats.push({ label: '⚡ 连锁', value: plant.chainCount + '次', color: 'text-purple-300' })
  if (plant.pierces) stats.push({ label: '🔱 穿透', value: plant.pierces >= 99 ? '无限' : String(plant.pierces), color: 'text-purple-300' })
  if (plant.maxHp && plant.maxHp > plant.hp) stats.push({ label: '🛡️ 上限', value: String(plant.maxHp), color: 'text-green-300' })
  if (plant.regenCount) stats.push({ label: '♻️ 再生', value: plant.regenCount + '次', color: 'text-green-300' })
  if (plant.growStages) stats.push({ label: '📈 成长', value: plant.growStages.length + '阶段', color: 'text-green-300' })
  if (plant.launcherRows !== undefined) stats.push({ label: '🎯 范围', value: plant.launcherRows + '行', color: 'text-red-300' })
  return stats
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-green-900 to-green-950 p-6">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center gap-4 mb-6">
        <n-button text @click="router.push('/')">
          <span class="text-white text-lg">← 返回</span>
        </n-button>
        <h1 class="text-3xl font-bold text-white">📖 植物图鉴</h1>
      </div>

      <n-tabs type="segment" default-value="common" class="mb-6">
        <!-- Common plants tab -->
        <n-tab-pane name="common" tab="🌱 普通植物 (30)">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div
              v-for="plant in commonPlants"
              :key="plant.id"
              class="rounded-xl p-4 transition-all"
              :class="isOwned(plant.id)
                ? 'bg-green-800/60 border-2 border-green-400/60'
                : 'bg-green-800/40 border border-green-600/30 hover:border-green-400/60'"
            >
              <div class="flex items-center gap-3 mb-3">
                <span class="text-4xl">{{ plant.emoji }}</span>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-white font-bold text-lg">{{ plant.name }}</span>
                    <span class="text-xs px-1.5 py-0.5 rounded border" :class="getRarityClass(plant.rarity)">
                      {{ getRarityBadge(plant.rarity) }}
                    </span>
                    <span v-if="isOwned(plant.id)" class="text-xs" title="已拥有">✅</span>
                  </div>
                  <span class="text-gray-400 text-xs">#{{ plant.id }}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div
                  v-for="s in statFields"
                  :key="s.key"
                  class="bg-black/30 rounded-lg px-3 py-1.5 flex justify-between"
                >
                  <span class="text-gray-400">{{ s.label }}</span>
                  <span :class="[s.class, 'font-bold']">{{ s.fmt((plant as any)[s.key]) }}</span>
                </div>
                <div
                  v-for="s in getExtraStats(plant)"
                  :key="s.label"
                  class="bg-black/30 rounded-lg px-3 py-1.5 flex justify-between"
                >
                  <span class="text-gray-400">{{ s.label }}</span>
                  <span :class="[s.color, 'font-bold']">{{ s.value }}</span>
                </div>
              </div>

              <div class="flex flex-wrap gap-1" v-if="plant.tags.length > 0">
                <span
                  v-for="tag in plant.tags"
                  :key="tag"
                  class="text-2xs px-2 py-0.5 rounded-full bg-blue-900/40 border border-blue-500/20 text-blue-300"
                >
                  {{ getTagDesc(tag) }}
                </span>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <!-- Rare plants tab -->
        <n-tab-pane name="rare" tab="✨ 稀有植物 (20)">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div
              v-for="plant in rarePlants"
              :key="plant.id"
              class="rounded-xl p-4 transition-all"
              :class="isOwned(plant.id)
                ? 'bg-purple-900/50 border-2 border-purple-400/60'
                : 'bg-purple-900/30 border border-purple-600/30 hover:border-purple-400/60'"
            >
              <div class="flex items-center gap-3 mb-3">
                <span class="text-4xl">{{ plant.emoji }}</span>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-white font-bold text-lg">{{ plant.name }}</span>
                    <span class="text-xs px-1.5 py-0.5 rounded border" :class="getRarityClass(plant.rarity)">
                      {{ getRarityBadge(plant.rarity) }}
                    </span>
                    <span v-if="isOwned(plant.id)" class="text-xs" title="已拥有">✅</span>
                  </div>
                  <span class="text-gray-400 text-xs">#{{ plant.id }}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div
                  v-for="s in statFields"
                  :key="s.key"
                  class="bg-black/30 rounded-lg px-3 py-1.5 flex justify-between"
                >
                  <span class="text-gray-400">{{ s.label }}</span>
                  <span :class="[s.class, 'font-bold']">{{ s.fmt((plant as any)[s.key]) }}</span>
                </div>
                <div
                  v-for="s in getExtraStats(plant)"
                  :key="s.label"
                  class="bg-black/30 rounded-lg px-3 py-1.5 flex justify-between"
                >
                  <span class="text-gray-400">{{ s.label }}</span>
                  <span :class="[s.color, 'font-bold']">{{ s.value }}</span>
                </div>
              </div>

              <div class="flex flex-wrap gap-1" v-if="plant.tags.length > 0">
                <span
                  v-for="tag in plant.tags"
                  :key="tag"
                  class="text-2xs px-2 py-0.5 rounded-full bg-purple-900/40 border border-purple-500/20 text-purple-300"
                >
                  {{ getTagDesc(tag) }}
                </span>
              </div>
            </div>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>
