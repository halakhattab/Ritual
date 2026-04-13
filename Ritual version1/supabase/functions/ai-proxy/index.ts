// @ts-nocheck — Deno runtime, not Node.js

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  // Require an Authorization header (Supabase JS client sends this automatically when logged in)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Parse request body
  let system, messages, max_tokens
  try {
    const body = await req.json()
    system = body.system
    messages = body.messages
    max_tokens = body.max_tokens ?? 300
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages must be a non-empty array')
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Invalid request body: ${err.message}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Gemini API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Convert to Gemini format — prepend system prompt to first user message
  const geminiContents = messages.map((m, i) => {
    let text = m.content
    if (i === 0 && system) text = `${system}\n\n${text}`
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text }],
    }
  })

  try {
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: { maxOutputTokens: max_tokens, temperature: 0.85 },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      return new Response(
        JSON.stringify({ error: `Gemini error: ${errText}` }),
        { status: geminiRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await geminiRes.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
