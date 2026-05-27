<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useGameStore } from '../stores/game'
import { getUserInventory } from '../api/user'
import { PLANT_CONFIGS } from '../engine/constants'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const gameStore = useGameStore()

const world = Number(route.params.world)
const level = Number(route.params.level)
const ownedPlantIds = ref<number[]>([])
const selected = ref<Set<number>>(new Set())
const loading = ref(true)

const maxSlots = computed(() => auth.user?.plantSlots ?? 7)

const plants = computed(() =>
  ownedPlantIds.value
    .map(id => ({ id, ...PLANT_CONFIGS[id] }))
    .filter(p => p.name)
    .sort((a, b) => a.id - b.id)
)

onMounted(async () => {
  try {
    const { data } = await getUserInventory()
    if (data?.data?.plants) {
      ownedPlantIds.value = data.data.plants.map((p: any) => p.plantId)
    }
  } catch { /* ignore */ }

  // If user has <= maxSlots plants, auto-select all and skip to game
  if (ownedPlantIds.value.length <= maxSlots.value) {
    gameStore.selectedPlants = [...ownedPlantIds.value]
    router.replace(`/game/${world}/${level}`)
    return
  }

  loading.value = false
})

function togglePlant(id: number) {
  if (selected.value.has(id)) {
    selected.value.delete(id)
  } else if (selected.value.size < maxSlots.value) {
    selected.value.add(id)
  }
  // Trigger reactivity
  selected.value = new Set(selected.value)
}

function confirm() {
  if (selected.value.size === 0) return
  gameStore.selectedPlants = Array.from(selected.value)
  router.push(`/game/${world}/${level}`)
}

function goBack() {
  router.push(`/levels/${world}`)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-green-900 to-green-950 p-6">
    <div v-if="loading" class="flex justify-center py-20">
      <n-spin size="large" />
    </div>

    <div v-else class="max-w-4xl mx-auto">
      <div class="flex items-center gap-4 mb-4">
        <n-button text @click="goBack">
          <span class="text-white text-lg">← 返回</span>
        </n-button>
        <h1 class="text-2xl font-bold text-white">选择植物</h1>
        <span class="text-gray-300">
          已选 {{ selected.size }} / {{ maxSlots }}
        </span>
        <div class="flex-1" />
        <n-button
          type="success"
          :disabled="selected.size === 0"
          @click="confirm"
        >
          开始战斗
        </n-button>
      </div>

      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        <div
          v-for="plant in plants"
          :key="plant.id"
          class="rounded-xl p-3 text-center cursor-pointer transition-all border-2"
          :class="selected.has(plant.id)
            ? 'bg-green-700/70 border-green-400 scale-105'
            : selected.size >= maxSlots
              ? 'bg-green-800/30 border-green-800/20 opacity-40 cursor-not-allowed'
              : 'bg-green-800/40 border-green-700/30 hover:border-green-400/60'"
          @click="togglePlant(plant.id)"
        >
          <div class="text-3xl mb-1">{{ plant.emoji }}</div>
          <div class="text-white text-sm font-medium truncate">{{ plant.name }}</div>
          <div class="flex justify-center gap-2 text-xs mt-1 text-gray-400">
            <span>☀️{{ plant.cost }}</span>
            <span>⚔️{{ plant.damage || '-' }}</span>
          </div>
          <div v-if="selected.has(plant.id)" class="text-green-400 text-lg mt-1">✓</div>
        </div>
      </div>
    </div>
  </div>
</template>
