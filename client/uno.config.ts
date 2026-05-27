import { defineConfig } from 'unocss'

export default defineConfig({
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer',
    'btn-primary': 'btn bg-green-600 text-white hover:bg-green-700',
    'btn-danger': 'btn bg-red-500 text-white hover:bg-red-600',
    'btn-ghost': 'btn bg-transparent hover:bg-gray-100',
  },
})
