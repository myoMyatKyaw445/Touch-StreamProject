import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // <-- ဒီလိုင်းကို ထည့်ပေးလိုက်ပါ
    port: 5173
  }
})