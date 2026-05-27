<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getShopItems, buyItem, exchangeGems, buyPlantSlot } from '../api/shop'
import { getUserInventory } from '../api/user'
import { PLANT_CONFIGS } from '../engine/constants'

const router = useRouter()
const auth = useAuthStore()

interface ShopItem {
  id: string
  name: string
  type: string
  priceCoins: number
  priceGems: number
  effectJson: string
}

const items = ref<ShopItem[]>([])
const ownedPlantIds = ref<number[]>([])
const loading = ref(true)
const purchasing = ref<string | null>(null)
const message = ref('')
const exchangeAmount = ref(1)
const exchanging = ref(false)
const buyingSlot = ref(false)

onMounted(async () => {
  try {
    const [itemsRes, invRes] = await Promise.all([
      getShopItems(),
      getUserInventory(),
    ])
    if (itemsRes.data?.data) {
      items.value = itemsRes.data.data
    }
    if (invRes.data?.data?.plants) {
      ownedPlantIds.value = invRes.data.data.plants.map((p: any) => p.plantId)
    }
  } catch (e) {
    console.error('Failed to load shop:', e)
  }
  loading.value = false
})

const ownedRareCount = computed(() =>
  ownedPlantIds.value.filter(id => id >= 101 && id <= 120).length
)

function escalatedPrice(item: ShopItem): number {
  if (item.type !== 'plant') return item.priceCoins
  const plantId = parseInt(item.effectJson || '0')
  if (plantId < 101 || plantId > 120) return item.priceCoins
  return item.priceCoins * (ownedRareCount.value + 1)
}

function isOwned(item: ShopItem): boolean {
  if (item.type !== 'plant') return false
  const plantId = parseInt(item.effectJson || '0')
  return ownedPlantIds.value.includes(plantId)
}

function getPlantEmoji(item: ShopItem): string {
  const plantId = parseInt(item.effectJson || '0')
  return PLANT_CONFIGS[plantId]?.emoji || '🌱'
}

function getPlantCost(item: ShopItem): number {
  const plantId = parseInt(item.effectJson || '0')
  return PLANT_CONFIGS[plantId]?.cost || 0
}

async function handleBuy(item: ShopItem) {
  purchasing.value = item.id
  message.value = ''
  try {
    const res = await buyItem(item.id)
    if (res.data?.success) {
      message.value = `成功购买 ${item.name}!`
      const plantId = parseInt(item.effectJson || '0')
      if (plantId > 0) ownedPlantIds.value.push(plantId)
      // Deduct coins locally
      const price = escalatedPrice(item)
      if (auth.user) {
        auth.user.coins -= price
      }
    }
  } catch (e: any) {
    message.value = e?.response?.data?.message || '购买失败'
  }
  purchasing.value = null
}

async function handleExchange() {
  if (exchangeAmount.value <= 0) return
  exchanging.value = true
  message.value = ''
  try {
    const res = await exchangeGems(exchangeAmount.value)
    if (res.data?.success) {
      message.value = res.data.message
      if (auth.user) {
        auth.user.gems -= exchangeAmount.value
        auth.user.coins += exchangeAmount.value * 100
      }
    }
  } catch (e: any) {
    message.value = e?.response?.data?.message || '兑换失败'
  }
  exchanging.value = false
}

async function handleBuySlot() {
  buyingSlot.value = true
  message.value = ''
  try {
    const res = await buyPlantSlot()
    if (res.data?.success) {
      message.value = `槽位已扩充至 ${res.data.plantSlots} 个!`
      if (auth.user) {
        auth.user.gems -= 1
        auth.user.plantSlots = res.data.plantSlots
      }
    }
  } catch (e: any) {
    message.value = e?.response?.data?.message || '购买失败'
  }
  buyingSlot.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-green-900 to-green-950 p-6">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center gap-4 mb-4">
        <n-button text @click="router.push('/')">
          <span class="text-white text-lg">← 返回</span>
        </n-button>
        <h1 class="text-3xl font-bold text-white">商店</h1>
        <span class="text-amber-400 font-bold text-lg ml-auto">💵 {{ auth.user?.coins || 0 }}</span>
        <span class="text-blue-400 font-bold">💎 {{ auth.user?.gems || 0 }}</span>
      </div>

      <p class="text-gray-400 mb-6 text-sm">
        稀有植物用金币购买。每次购买后，下一株稀有植物价格递增。
        已拥有 <span class="text-purple-400 font-bold">{{ ownedRareCount }}</span> 株稀有植物
        (当前倍率: ×{{ ownedRareCount + 1 }})
      </p>

      <!-- Diamond Exchange -->
      <div class="bg-blue-900/40 border border-blue-500/30 rounded-xl p-4 mb-6">
        <h3 class="text-blue-300 font-bold mb-3">💎 钻石兑换金币</h3>
        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="text-gray-300 text-sm">兑换:</span>
            <n-input-number
              v-model:value="exchangeAmount"
              :min="1"
              :max="auth.user?.gems || 0"
              size="small"
              :style="{ width: '80px' }"
            />
            <span class="text-gray-300 text-sm">颗钻石</span>
          </div>
          <span class="text-gray-400">→</span>
          <span class="text-yellow-400 font-bold text-lg">💵 +{{ exchangeAmount * 100 }}</span>
          <n-button
            type="info"
            size="small"
            :loading="exchanging"
            :disabled="(auth.user?.gems || 0) < 1"
            @click="handleExchange"
          >
            兑换
          </n-button>
        </div>
        <p class="text-blue-400/60 text-xs mt-2">汇率: 1 💎 = 100 💵</p>
      </div>

      <!-- Plant Slot Purchase -->
      <div class="bg-purple-900/40 border border-purple-500/30 rounded-xl p-4 mb-6">
        <h3 class="text-purple-300 font-bold mb-3">🔧 植物槽位扩充</h3>
        <div class="flex items-center gap-4 flex-wrap">
          <span class="text-gray-300 text-sm">
            当前槽位: <span class="text-white font-bold">{{ auth.user?.plantSlots ?? 7 }}</span> / 10
          </span>
          <n-button
            type="warning"
            size="small"
            :loading="buyingSlot"
            :disabled="(auth.user?.plantSlots ?? 7) >= 10 || (auth.user?.gems ?? 0) < 1"
            @click="handleBuySlot"
          >
            <template v-if="(auth.user?.plantSlots ?? 7) >= 10">已满</template>
            <template v-else>扩充 +1 (💎 1)</template>
          </n-button>
        </div>
        <p class="text-purple-400/60 text-xs mt-2">花费 1 💎 增加 1 个植物槽位，最多购买 3 次</p>
      </div>

      <div v-if="message" class="mb-4">
        <n-alert :type="message.includes('成功') ? 'success' : 'error'" closable @close="message = ''">
          {{ message }}
        </n-alert>
      </div>

      <n-spin v-if="loading" class="flex justify-center" />

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="item in items"
          :key="item.id"
          class="bg-green-800/60 rounded-xl p-4 border-2 transition-all"
          :class="isOwned(item) ? 'border-green-500/30 opacity-60' : 'border-green-700/50 hover:border-green-400'"
        >
          <div class="text-center mb-2">
            <span class="text-4xl">{{ getPlantEmoji(item) }}</span>
            <div class="text-white font-bold truncate">{{ item.name }}</div>
            <div class="text-green-300 text-xs">
              阳光消耗: {{ getPlantCost(item) }}☀
            </div>
          </div>

          <div v-if="isOwned(item)" class="text-center text-green-400 font-bold text-sm">
            ✅ 已拥有
          </div>
          <div v-else class="text-center">
            <div class="text-yellow-400 font-bold mb-2">
              💵 {{ escalatedPrice(item) }}
              <span v-if="escalatedPrice(item) !== item.priceCoins" class="text-xs text-gray-400 line-through">
                {{ item.priceCoins }}
              </span>
            </div>
            <n-button
              type="warning"
              size="small"
              block
              :loading="purchasing === item.id"
              :disabled="(auth.user?.coins || 0) < escalatedPrice(item)"
              @click="handleBuy(item)"
            >
              {{ (auth.user?.coins || 0) < escalatedPrice(item) ? '不足' : '购买' }}
            </n-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
