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

      // ── 本地开发：模拟 /api/vision Serverless 函数 ──────────
      // 部署到 Vercel 后由 api/vision.js 接管，此中间件仅在 dev 生效
      {
        name: 'vision-api-dev-middleware',
        configureServer(server) {
          server.middlewares.use('/api/vision', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }

            try {
              // 读取请求体
              const chunks = []
              for await (const chunk of req) {
                chunks.push(chunk)
              }
              const body = JSON.parse(Buffer.concat(chunks).toString())
              const { imageBase64 } = body

              if (!imageBase64) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Missing imageBase64' }))
                return
              }

              const apiKey = env.OPENAI_API_KEY
              if (!apiKey) {
                console.error('[vision-dev] OPENAI_API_KEY 未在 .env 中配置')
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'OPENAI_API_KEY not set in .env' }))
                return
              }

              const openaiRes = await fetch(
                'https://api.openai.com/v1/chat/completions',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                      {
                        role: 'user',
                        content: [
                          {
                            type: 'text',
                            text: "列出图片中所有你能识别的食材，仅返回食材名称，用逗号分隔，不要任何解释。如果未发现食材，返回'NONE'。",
                          },
                          {
                            type: 'image_url',
                            image_url: {
                              url: `data:image/jpeg;base64,${imageBase64}`,
                            },
                          },
                        ],
                      },
                    ],
                  }),
                },
              )

              if (!openaiRes.ok) {
                const errBody = await openaiRes.text().catch(() => '')
                console.error(
                  `[vision-dev] OpenAI 返回 ${openaiRes.status}: ${errBody}`,
                )
                res.statusCode = openaiRes.status
                res.setHeader('Content-Type', 'application/json')
                res.end(
                  JSON.stringify({
                    error: `OpenAI API 请求失败 (${openaiRes.status})`,
                  }),
                )
                return
              }

              const data = await openaiRes.json()
              const content =
                data.choices?.[0]?.message?.content?.trim() || ''

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ content }))
            } catch (err) {
              console.error('[vision-dev] 异常:', err.message)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message || 'Internal error' }))
            }
          })
        },
      },
    ],

    server: {
      proxy: {
        '/api': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          // 去掉 /api 前缀：/api/v1/chat/completions → /v1/chat/completions
          rewrite: (path) => path.replace(/^\/api/, ''),
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
