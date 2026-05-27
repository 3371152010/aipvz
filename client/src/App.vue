<script setup lang="ts">
import { onMounted } from 'vue'
import { darkTheme, zhCN, dateZhCN } from 'naive-ui'
import { useSettingsStore } from './stores/settings'
import { useAuthStore } from './stores/auth'

const settings = useSettingsStore()
const auth = useAuthStore()

onMounted(async () => {
  auth.restoreSession()
  if (auth.isLoggedIn) {
    await auth.fetchUser()
  }
})
</script>

<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme="settings.isDark ? darkTheme : undefined">
    <n-notification-provider>
      <n-message-provider>
        <n-dialog-provider>
          <router-view />
        </n-dialog-provider>
      </n-message-provider>
    </n-notification-provider>
  </n-config-provider>
</template>
