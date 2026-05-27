<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useMessage } from 'naive-ui'
import request from '../api/request'

const router = useRouter()
const auth = useAuthStore()
const message = useMessage()

const email = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    message.warning('请输入邮箱和密码')
    return
  }
  loading.value = true
  try {
    const { data } = await request.post('/auth/login', {
      email: email.value,
      password: password.value,
    })
    auth.setTokens(data.data.accessToken, data.data.refreshToken)
    await auth.fetchUser()
    message.success('登录成功')
    router.push('/')
  } catch (e: any) {
    const msg = e.response?.data?.message
    if (msg?.includes('Invalid') || msg?.includes('credentials')) {
      message.error('邮箱或密码错误')
    } else {
      message.error(msg || '登录失败')
    }
  } finally {
    loading.value = false
  }
}

async function handleGuest() {
  try {
    const { data } = await request.post('/auth/guest')
    auth.setTokens(data.data.accessToken, data.data.refreshToken)
    auth.isGuest = true
    await auth.fetchUser()
    message.success('已进入游客模式')
    router.push('/levels/1')
  } catch {
    message.error('游客登录失败')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-900 to-green-950 p-4">
    <n-card class="w-400px max-w-90vw">
      <h1 class="text-2xl font-bold text-center mb-6">登录</h1>

      <n-form>
        <n-form-item label="邮箱">
          <n-input v-model:value="email" placeholder="example@mail.com" />
        </n-form-item>
        <n-form-item label="密码">
          <n-input v-model:value="password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </n-form-item>
      </n-form>

      <n-button type="success" block :loading="loading" @click="handleLogin">
        登录
      </n-button>

      <div class="flex justify-between mt-4">
        <n-button text @click="router.push('/register')">没有账号？注册</n-button>
        <n-button text @click="handleGuest">游客试玩</n-button>
      </div>
    </n-card>
  </div>
</template>
