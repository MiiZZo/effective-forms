import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'effector-forms-zod',
      fileName: 'index',
    },
    rollupOptions: {
      external: ['effector', 'zod'],
    },
  },
})
