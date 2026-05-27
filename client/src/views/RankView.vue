<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTotalRank, getStarsRank, getSpeedRank } from '../api/rank'

const router = useRouter()

interface RankEntry {
  rank: number
  userId: string
  nickname: string
  coins?: number
  gems?: number
  totalStars?: number
  levelName?: string
  durationSec?: number
  stars?: number
}

const totalRank = ref<RankEntry[]>([])
const starsRank = ref<RankEntry[]>([])
const speedRank = ref<RankEntry[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [totalRes, starsRes, speedRes] = await Promise.all([
      getTotalRank(),
      getStarsRank(),
      getSpeedRank(),
    ])
    if (totalRes.data?.data) totalRank.value = totalRes.data.data
    if (starsRes.data?.data) starsRank.value = starsRes.data.data
    if (speedRes.data?.data) speedRank.value = speedRes.data.data
  } catch { /* ignore */ }
  loading.value = false
})

function getRankClass(rank: number) {
  if (rank === 1) return 'text-yellow-400 text-xl'
  if (rank === 2) return 'text-gray-300 text-lg'
  if (rank === 3) return 'text-amber-600 text-lg'
  return 'text-gray-500'
}

function getRankBg(rank: number) {
  if (rank === 1) return 'bg-yellow-500/20 border-yellow-500/40'
  if (rank === 2) return 'bg-gray-400/10 border-gray-400/30'
  if (rank === 3) return 'bg-amber-700/20 border-amber-600/30'
  return 'border-green-700/30'
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-green-900 to-green-950 p-6">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-4 mb-6">
        <n-button text @click="router.push('/')">
          <span class="text-white text-lg">← 返回</span>
        </n-button>
        <h1 class="text-3xl font-bold text-white">🏆 排行榜</h1>
      </div>

      <n-tabs type="segment" default-value="total">
        <n-tab-pane name="total" tab="💰 财富榜">
          <n-spin v-if="loading" class="flex justify-center py-12" />
          <div v-else class="space-y-2 mt-4">
            <div v-if="totalRank.length === 0" class="text-gray-400 text-center py-8">暂无数据</div>
            <div
              v-for="entry in totalRank" :key="entry.userId"
              class="flex items-center gap-4 rounded-xl px-4 py-3 border transition-all"
              :class="getRankBg(entry.rank)"
            >
              <span class="font-bold w-8 text-center" :class="getRankClass(entry.rank)">
                #{{ entry.rank }}
              </span>
              <span class="text-white font-medium flex-1 truncate">{{ entry.nickname }}</span>
              <div class="flex items-center gap-3 text-sm">
                <span class="text-yellow-400">💵 {{ entry.coins?.toLocaleString() || 0 }}</span>
                <span class="text-blue-400">💎 {{ entry.gems || 0 }}</span>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane name="stars" tab="⭐ 星级榜">
          <n-spin v-if="loading" class="flex justify-center py-12" />
          <div v-else class="space-y-2 mt-4">
            <div v-if="starsRank.length === 0" class="text-gray-400 text-center py-8">暂无数据</div>
            <div
              v-for="entry in starsRank" :key="entry.userId"
              class="flex items-center gap-4 rounded-xl px-4 py-3 border transition-all"
              :class="getRankBg(entry.rank)"
            >
              <span class="font-bold w-8 text-center" :class="getRankClass(entry.rank)">
                #{{ entry.rank }}
              </span>
              <span class="text-white font-medium flex-1 truncate">{{ entry.nickname }}</span>
              <div class="flex items-center gap-1 text-sm">
                <span class="text-yellow-400 text-lg">{{ '⭐'.repeat(Math.min((entry.totalStars || 0), 5)) }}</span>
                <span class="text-yellow-400 font-bold">{{ entry.totalStars }}</span>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane name="speed" tab="⚡ 速通榜">
          <n-spin v-if="loading" class="flex justify-center py-12" />
          <div v-else class="space-y-2 mt-4">
            <div v-if="speedRank.length === 0" class="text-gray-400 text-center py-8">暂无数据</div>
            <div
              v-for="entry in speedRank" :key="`${entry.userId}-${entry.rank}`"
              class="flex items-center gap-4 rounded-xl px-4 py-3 border transition-all"
              :class="getRankBg(entry.rank)"
            >
              <span class="font-bold w-8 text-center" :class="getRankClass(entry.rank)">
                #{{ entry.rank }}
              </span>
              <span class="text-white font-medium flex-1 truncate">{{ entry.nickname }}</span>
              <div class="flex items-center gap-3 text-sm text-right">
                <span class="text-gray-400">{{ entry.levelName }}</span>
                <span class="text-cyan-300 font-mono font-bold">{{ formatTime(entry.durationSec || 0) }}</span>
                <span class="text-yellow-400">{{ '⭐'.repeat(entry.stars || 0) }}</span>
              </div>
            </div>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>
