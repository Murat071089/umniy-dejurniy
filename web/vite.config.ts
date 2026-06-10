import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Для локальной разработки используем './', для GitHub Pages — '/umniy-dejurniy/'
  base: mode === 'production' ? '/umniy-dejurniy/' : './',
}))

