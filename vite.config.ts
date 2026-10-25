import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { imageShrinkPlugin } from './build/imageShrinkPlugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), imageShrinkPlugin()],
})
