<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
</script>

<template>
  <div class="home-view min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-900 via-green-800 to-green-950">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-green-300 mb-2 drop-shadow-lg">植物大战僵尸</h1>
      <p class="text-xl text-green-400 mb-4">Plants vs. Zombies</p>

      <!-- User resources -->
      <div v-if="auth.isLoggedIn" class="flex justify-center gap-6 mb-8">
        <div class="bg-black/30 rounded-lg px-4 py-2 flex items-center gap-2">
          <span class="text-2xl">💵</span>
          <span class="text-yellow-400 text-xl font-bold">{{ auth.user?.coins || 0 }}</span>
        </div>
        <div class="bg-black/30 rounded-lg px-4 py-2 flex items-center gap-2">
          <span class="text-2xl">💎</span>
          <span class="text-blue-400 text-xl font-bold">{{ auth.user?.gems || 0 }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-4 items-center w-64 mx-auto">
        <n-button
          v-if="auth.isLoggedIn"
          type="success"
          size="large"
          block
          @click="router.push('/levels/1')"
        >
          开始游戏
        </n-button>
        <n-button
          v-if="!auth.isLoggedIn"
          type="success"
          size="large"
          block
          @click="router.push('/login')"
        >
          登录
        </n-button>
        <n-button
          v-if="!auth.isLoggedIn"
          size="large"
          block
          ghost
          @click="router.push('/register')"
        >
          注册
        </n-button>
        <n-button
          size="large"
          block
          @click="router.push('/guide')"
        >
          植物图鉴
        </n-button>
        <n-button
          size="large"
          block
          @click="router.push('/rank')"
        >
          排行榜
        </n-button>
        <n-button
          v-if="auth.isLoggedIn"
          size="large"
          block
          type="warning"
          @click="router.push('/shop')"
        >
          商店
        </n-button>
        <n-button
          v-if="auth.isLoggedIn"
          size="large"
          block
          @click="router.push('/profile')"
        >
          个人中心
        </n-button>
      </div>
    </div>
  </div>
</template>
