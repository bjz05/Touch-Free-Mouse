import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    // IMPORTANT: This must match your GitHub repository name.
    // e.g. If your repo is https://github.com/username/gesturescroll-ai
    // then this must be '/gesturescroll-ai/'
    base: '/gesturescroll-ai/',
    plugins: [react()],
    define: {
      // This polyfills process.env.API_KEY so the SDK works in the browser
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      host: "0.0.0.0",
      port: 3000
    }
  }
})