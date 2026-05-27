import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const isDark = ref(false)
  const volume = ref({ bgm: 80, sfx: 100 })
  const language = ref('zh-CN')

  function toggleDark() {
    isDark.value = !isDark.value
  }

  return { isDark, volume, language, toggleDark }
})
