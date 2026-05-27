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
const nickname = ref('')
const password = ref('')
const password2 = ref('')
const loading = ref(false)
const errors = ref<Record<string, string>>({})

function validate(): boolean {
  errors.value = {}
  if (!email.value) { errors.value.email = '请输入邮箱' }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { errors.value.email = '邮箱格式不正确' }
  if (!nickname.value) { errors.value.nickname = '请输入昵称' }
  else if (nickname.value.length < 2) { errors.value.nickname = '昵称至少2个字符' }
  if (!password.value) { errors.value.password = '请输入密码' }
  else if (password.value.length < 6) { errors.value.password = '密码至少6位' }
  if (password.value !== password2.value) { errors.value.password2 = '两次密码不一致' }
  return Object.keys(errors.value).length === 0
}

async function handleRegister() {
  if (!validate()) return
  loading.value = true
  try {
    const { data } = await request.post('/auth/register', {
      email: email.value,
      nickname: nickname.value,
      password: password.value,
    })
    auth.setTokens(data.data.accessToken, data.data.refreshToken)
    await auth.fetchUser()
    message.success('注册成功')
    router.push('/')
  } catch (e: any) {
    const msg = e.response?.data?.message
    if (msg) {
      if (msg.includes('already')) message.error('该邮箱已被注册')
      else message.error(typeof msg === 'string' ? msg : '注册失败，请检查输入')
    } else {
      message.error('网络错误，请稍后重试')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-900 to-green-950 p-4">
    <n-card class="w-400px max-w-90vw">
      <h1 class="text-2xl font-bold text-center mb-6">注册</h1>

      <n-form>
        <n-form-item label="邮箱" :feedback="errors.email">
          <n-input
            v-model:value="email"
            placeholder="example@mail.com"
            :status="errors.email ? 'error' : undefined"
            @input="errors.email = ''"
          />
        </n-form-item>
        <n-form-item label="昵称" :feedback="errors.nickname">
          <n-input
            v-model:value="nickname"
            placeholder="你的游戏昵称（至少2字）"
            :status="errors.nickname ? 'error' : undefined"
            @input="errors.nickname = ''"
          />
        </n-form-item>
        <n-form-item label="密码" :feedback="errors.password">
          <n-input
            v-model:value="password"
            type="password"
            placeholder="至少6位"
            :status="errors.password ? 'error' : undefined"
            @input="errors.password = ''"
          />
        </n-form-item>
        <n-form-item label="确认密码" :feedback="errors.password2">
          <n-input
            v-model:value="password2"
            type="password"
            placeholder="再次输入密码"
            :status="errors.password2 ? 'error' : undefined"
            @keyup.enter="handleRegister"
            @input="errors.password2 = ''"
          />
        </n-form-item>
      </n-form>

      <n-button type="success" block :loading="loading" @click="handleRegister">
        注册
      </n-button>

      <div class="mt-4 text-center">
        <n-button text @click="router.push('/login')">已有账号？登录</n-button>
      </div>
    </n-card>
  </div>
</template>
