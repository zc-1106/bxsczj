/**
 * Vercel Serverless Function — 图片食材识别代理
 *
 * 前端调用：POST /api/vision  { imageBase64: string }
 * 服务端读取 Vercel 环境变量 OPENAI_API_KEY 并转发给 OpenAI Vision API
 *
 * 注意：此文件仅在 Vercel 部署环境生效，本地开发由 vite.config.js 中的代理处理
 */

export default async function handler(req, res) {
  // ── 仅允许 POST ──────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { imageBase64 } = req.body || {}
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid imageBase64' })
  }

  // ── 服务端读取 API Key，浏览器永远看不到 ──────────────────
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('[vision] OPENAI_API_KEY 未在 Vercel 环境变量中配置')
    return res.status(500).json({ error: 'Server misconfigured: OPENAI_API_KEY not set' })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    })

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      console.error(`[vision] OpenAI API 返回错误 ${response.status}: ${errBody}`)
      return res.status(response.status).json({
        error: `OpenAI API 请求失败 (${response.status})`,
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''

    return res.status(200).json({ content })
  } catch (err) {
    console.error('[vision] 请求异常:', err.message)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
