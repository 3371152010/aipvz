<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getWorldOverview } from '../api/level'
import { getUserInventory } from '../api/user'
import { useAuthStore } from '../stores/auth'
import { useGameStore } from '../stores/game'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const gameStore = useGameStore()
const world = Number(route.params.world)

const levels = ref<any[]>([])
const loading = ref(true)
const ownedPlantIds = ref<number[]>([])

const worlds = [
  { id: 1, name: '白天', icon: '☀️', description: '阳光明媚的草坪' },
  { id: 2, name: '夜晚', icon: '🌙', description: '黑暗中的战斗' },
  { id: 3, name: '泳池', icon: '🌊', description: '水池的挑战' },
]

async function loadLevels() {
  loading.value = true
  try {
    const { data } = await getWorldOverview(world)
    levels.value = data.data || []
  } catch {
    levels.value = []
  }
  try {
    const { data } = await getUserInventory()
    if (data?.data?.plants) {
      ownedPlantIds.value = data.data.plants.map((p: any) => p.plantId)
    }
  } catch { /* ignore */ }
  loading.value = false
}

function goToLevel(level: any) {
  if (!level.unlocked) return
  const slots = auth.user?.plantSlots ?? 7
  if (ownedPlantIds.value.length > slots) {
    router.push(`/select/${world}/${level.levelNumber}`)
  } else {
    gameStore.selectedPlants = [...ownedPlantIds.value]
    router.push(`/game/${world}/${level.levelNumber}`)
  }
}

onMounted(loadLevels)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-green-900 to-green-950 p-6">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center gap-4 mb-8">
        <n-button text @click="router.push('/')">
          <span class="text-white text-lg">← 返回</span>
        </n-button>
        <h1 class="text-3xl font-bold text-white">世界 {{ world }} - {{ worlds[world - 1]?.name }}</h1>
        <span class="text-2xl">{{ worlds[world - 1]?.icon }}</span>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <n-spin size="large" />
      </div>

      <div v-else class="grid grid-cols-5 gap-4">
        <n-card
          v-for="level in levels"
          :key="level.id"
          class="cursor-pointer transition-all border-2"
          :class="level.unlocked
            ? 'hover:scale-105 bg-green-800/80 border-green-600'
            : 'opacity-50 bg-gray-800 border-gray-700 cursor-not-allowed'"
          @click="goToLevel(level)"
        >
          <div class="text-center">
            <div v-if="!level.unlocked" class="text-4xl mb-2">🔒</div>
            <div v-else class="text-4xl mb-2">🌱</div>
            <div class="text-white font-bold">关卡 {{ level.levelNumber }}</div>
            <div v-if="level.completed" class="flex justify-center gap-1 mt-1 text-lg">
              <span v-for="s in 3" :key="s" :class="s <= level.stars ? 'opacity-100' : 'opacity-20'">⭐</span>
            </div>
            <div v-if="level.bestTime" class="text-green-400 text-xs mt-1">
              {{ level.bestTime }}s
            </div>
          </div>
        </n-card>
      </div>
    </div>
  </div>
</template>
