<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { getLevelByWorldAndLevel } from '../api/level'
import { getUserInventory } from '../api/user'
import GameCanvas from '../components/game/GameCanvas.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const world = Number(route.params.world)
const level = Number(route.params.level)
const levelId = ref('')
const unlockedPlants = ref<number[]>([1, 2])
const loading = ref(true)

const isNight = world === 2
const hasPool = world === 3

onMounted(async () => {
  try {
    const { data } = await getLevelByWorldAndLevel(world, level)
    if (data?.data) {
      levelId.value = data.data.id
    }
  } catch {
    // Use default config
  }

  if (gameStore.selectedPlants.length > 0) {
    unlockedPlants.value = gameStore.selectedPlants
  } else {
    try {
      const { data } = await getUserInventory()
      if (data?.data?.plants) {
        unlockedPlants.value = data.data.plants.map((p: any) => p.plantId)
      }
    } catch {
      // fallback: base plants
    }
  }

  loading.value = false
  gameStore.startLevel(world, level, levelId.value)
})

function handleBack() {
  router.push(`/levels/${world}`)
}
</script>

<template>
  <div class="game-view w-full h-screen flex flex-col bg-black overflow-hidden">
    <div v-if="loading" class="flex-1 flex items-center justify-center bg-green-950">
      <n-spin size="large">
        <span class="text-white text-lg">加载关卡中...</span>
      </n-spin>
    </div>
    <div v-else class="game-area flex-1 relative">
      <GameCanvas
        :world="world"
        :level="level"
        :unlocked-plants="unlockedPlants"
        :is-night="isNight"
        :has-pool="hasPool"
        @back="handleBack"
      />
    </div>
  </div>
</template>
