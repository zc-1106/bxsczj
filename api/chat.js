/**
 * Vercel Edge Function — DeepSeek Chat API 流式代理
 *
 * 前端调用：POST /api/chat  { messages, model, temperature, max_tokens, ... }
 * 服务端读取 Vercel 环境变量 DEEPSEEK_API_KEY 并转发流式 SSE 响应给前端
 *
 * 使用 Edge Runtime（30s 超时，支持原生流式），适合 AI 长时生成场景
 * 本地开发由 vite.config.js 中的 proxy 处理
 */

export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  // ── 仅允许 POST ──────────────────────────────────────────
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 服务端读取 API Key，浏览器永远看不到 ──────────────────
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    console.error('[chat] DEEPSEEK_API_KEY 未在 Vercel 环境变量中配置')
    return new Response(JSON.stringify({ error: 'DEEPSEEK_API_KEY not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 解析请求体 ───────────────────────────────────────────
  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { model = 'deepseek-chat', messages, temperature, max_tokens } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing or invalid messages' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
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
      return new Response(
        JSON.stringify({ error: `DeepSeek API 请求失败 (${deepseekRes.status})` }),
        {
          status: deepseekRes.status,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // ── 流式转发：直接将 DeepSeek 的响应体管道给客户端 ──
    return new Response(deepseekRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('[chat] 请求异常:', err.message)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
