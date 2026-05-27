<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getUserInventory, updateUserProfile } from '../api/user'
import { PLANT_CONFIGS } from '../engine/constants'

const router = useRouter()
const auth = useAuthStore()

const ownedPlants = ref<number[]>([])
const loading = ref(true)
const editing = ref(false)
const editNickname = ref('')
const saving = ref(false)

onMounted(async () => {
  try {
    const { data } = await getUserInventory()
    if (data?.data?.plants) {
      ownedPlants.value = data.data.plants.map((p: any) => p.plantId)
    }
  } catch { /* ignore */ }
  loading.value = false
})

const commonPlants = computed(() =>
  ownedPlants.value.filter(id => id >= 1 && id <= 30).sort((a, b) => a - b)
)
const rarePlants = computed(() =>
  ownedPlants.value.filter(id => id >= 101 && id <= 120).sort((a, b) => a - b)
)

function startEdit() {
  editNickname.value = auth.user?.nickname || ''
  editing.value = true
}

async function saveNickname() {
  if (!editNickname.value.trim()) return
  saving.value = true
  try {
    await updateUserProfile({ nickname: editNickname.value.trim() })
    if (auth.user) auth.user.nickname = editNickname.value.trim()
    editing.value = false
  } catch { /* ignore */ }
  saving.value = false
}

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-green-900 to-green-950 p-6">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-4 mb-8">
        <n-button text @click="router.push('/')">
          <span class="text-white text-lg">← 返回</span>
        </n-button>
        <h1 class="text-3xl font-bold text-white">个人中心</h1>
      </div>

      <!-- User info card -->
      <n-card class="mb-6">
        <div class="flex flex-col items-center">
          <n-avatar :size="80" round class="mb-4 bg-green-700 text-4xl flex items-center justify-center">
            {{ auth.user?.nickname?.charAt(0) || '?' }}
          </n-avatar>

          <!-- Nickname: display or edit -->
          <div v-if="!editing" class="flex items-center gap-2 mb-1">
            <h2 class="text-xl font-bold">{{ auth.user?.nickname || '未登录' }}</h2>
            <n-button text size="tiny" @click="startEdit">✏️</n-button>
          </div>
          <div v-else class="flex items-center gap-2 mb-1">
            <n-input
              v-model:value="editNickname"
              size="small"
              :style="{ width: '160px' }"
              maxlength="12"
              @keyup.enter="saveNickname"
            />
            <n-button size="tiny" type="primary" :loading="saving" @click="saveNickname">保存</n-button>
            <n-button size="tiny" @click="editing = false">取消</n-button>
          </div>

          <div class="flex gap-6 mt-3">
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-400">💵 {{ auth.user?.coins || 0 }}</div>
              <div class="text-xs text-gray-400">金币</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-400">💎 {{ auth.user?.gems || 0 }}</div>
              <div class="text-xs text-gray-400">钻石</div>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Plant collection -->
      <n-card title="植物图鉴" class="mb-6">
        <n-spin v-if="loading" />

        <!-- Rare plants -->
        <div v-if="rarePlants.length > 0" class="mb-4">
          <h3 class="text-purple-400 font-bold mb-2">✨ 稀有植物 ({{ rarePlants.length }}/20)</h3>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="pid in rarePlants"
              :key="pid"
              class="bg-purple-900/40 border border-purple-500/30 rounded-lg px-3 py-2 flex items-center gap-2"
            >
              <span class="text-xl">{{ PLANT_CONFIGS[pid]?.emoji || '🌱' }}</span>
              <span class="text-white text-sm">{{ PLANT_CONFIGS[pid]?.name || '#'+pid }}</span>
            </div>
          </div>
        </div>

        <!-- Common plants -->
        <div>
          <h3 class="text-green-400 font-bold mb-2">🌱 普通植物 ({{ commonPlants.length }}/30)</h3>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="pid in commonPlants"
              :key="pid"
              class="bg-green-900/40 border border-green-500/30 rounded-lg px-3 py-2 flex items-center gap-2"
              :class="{ 'opacity-50': pid <= 2 }"
            >
              <span class="text-xl">{{ PLANT_CONFIGS[pid]?.emoji || '🌱' }}</span>
              <span class="text-white text-sm">{{ PLANT_CONFIGS[pid]?.name || '#'+pid }}</span>
            </div>
            <!-- Locked plants -->
            <div
              v-for="pid in 30"
              :key="'l'+pid"
              v-show="!commonPlants.includes(pid)"
              class="bg-gray-800/40 border border-gray-600/20 rounded-lg px-3 py-2 flex items-center gap-2 opacity-30"
            >
              <span class="text-xl">❓</span>
              <span class="text-gray-400 text-sm">{{ PLANT_CONFIGS[pid]?.name || '#'+pid }}</span>
            </div>
          </div>
        </div>
      </n-card>

      <n-button type="error" block @click="handleLogout">
        退出登录
      </n-button>
    </div>
  </div>
</template>
