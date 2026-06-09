/**
 * Vercel Serverless Function — DeepSeek Chat API 流式代理
 *
 * 前端调用：POST /api/chat  { messages, model, temperature, max_tokens, ... }
 * 服务端读取 Vercel 环境变量 DEEPSEEK_API_KEY 并转发流式 SSE 响应给前端
 *
 * 注意：此文件仅在 Vercel 部署环境生效，本地开发由 vite.config.js 中的 proxy 处理
 */

export default async function handler(req, res) {
  // ── 仅允许 POST ──────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── 服务端读取 API Key，浏览器永远看不到 ──────────────────
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    console.error('[chat] DEEPSEEK_API_KEY 未在 Vercel 环境变量中配置')
    return res.status(500).json({ error: 'DEEPSEEK_API_KEY not set' })
  }

  const { model = 'deepseek-chat', messages, temperature, max_tokens } = req.body || {}

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid messages' })
  }

  try {
    const deepseekRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature,
        max_tokens,
      }),
    })

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text().catch(() => '')
      console.error(`[chat] DeepSeek API 错误 ${deepseekRes.status}: ${errText}`)
      return res.status(deepseekRes.status).json({
        error: `DeepSeek API 请求失败 (${deepseekRes.status})`,
      })
    }

    // ── 流式转发 ──────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // 禁用 Nginx 缓冲

    const reader = deepseekRes.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(decoder.decode(value, { stream: true }))
      }
    } finally {
      reader.releaseLock()
    }

    res.end()
  } catch (err) {
    console.error('[chat] 请求异常:', err.message)

    // 如果还没发送响应头，返回 JSON 错误
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Internal server error' })
    }
    // 如果已经开始流式传输，只能结束连接
    if (!res.writableEnded) {
      res.end()
    }
  }
}
