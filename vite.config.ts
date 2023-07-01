import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'effector-forms-zod',
      fileName: 'index',
    },
    rollupOptions: {
      external: ['effector', 'zod'],
      output: {
        globals: {
          effector: 'effector',
          zod: 'zod',
        },
      },
    },
  },
})
