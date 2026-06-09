import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv(mode, dir, prefix) — prefix='' 表示加载所有环境变量（包括不带 VITE_ 的）
  // 不带 VITE_ 前缀的变量仅 Node 端可访问，不会泄露到浏览器
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),

    ],

    server: {
      proxy: {
        '/api/chat': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          // 精确重写：/api/chat → /v1/chat/completions
          rewrite: () => '/v1/chat/completions',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // 在服务端注入 API Key，浏览器永远看不到
              if (env.DEEPSEEK_API_KEY) {
                proxyReq.setHeader(
                  'Authorization',
                  `Bearer ${env.DEEPSEEK_API_KEY}`,
                )
              }
            })
          },
        },
      },
    },
  }
})
