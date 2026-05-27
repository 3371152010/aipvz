import { defineStore } from 'pinia'
import { ref } from 'vue'
import { submitBattle } from '../api/level'
import { useAuthStore } from './auth'

export const useGameStore = defineStore('game', () => {
  const currentLevelId = ref('')
  const currentWorld = ref(1)
  const currentLevel = ref(1)
  const plantsLost = ref(0)
  const startTime = ref(0)
  const plantsUsed = ref<number[]>([])
  const selectedPlants = ref<number[]>([])

  function startLevel(world: number, level: number, levelId: string) {
    currentWorld.value = world
    currentLevel.value = level
    currentLevelId.value = levelId
    plantsLost.value = 0
    plantsUsed.value = []
    startTime.value = Date.now()
  }

  function recordPlantUsed(plantType: number) {
    if (!plantsUsed.value.includes(plantType)) {
      plantsUsed.value.push(plantType)
    }
  }

  function incrementPlantsLost() {
    plantsLost.value++
  }

  async function endLevel(won: boolean, mowersUsed: number, stars: number) {
    const durationSec = Math.floor((Date.now() - startTime.value) / 1000)
    try {
      const { data } = await submitBattle({
        levelId: currentLevelId.value,
        won,
        plantsLost: plantsLost.value,
        durationSec,
        plantsUsed: plantsUsed.value,
        mowersUsed,
        stars,
      })
      return data.data
    } catch {
      return null
    }
  }

  // Refresh user coins/gems from server after battle
  async function syncUserResources() {
    const auth = useAuthStore()
    await auth.fetchUser()
  }

  return {
    currentLevelId, currentWorld, currentLevel,
    plantsLost, startTime, plantsUsed, selectedPlants,
    startLevel, recordPlantUsed, incrementPlantsLost, endLevel, syncUserResources,
  }
})
