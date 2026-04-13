const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

async function callGemini({ system, messages, max_tokens = 300 }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_key_here') {
    throw new Error('Gemini API key not configured')
  }

  const contents = messages.map((m, i) => {
    let text = m.content
    if (i === 0 && system) text = `${system}\n\n${text}`
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text }],
    }
  })

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: max_tokens, temperature: 0.85 },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!content) throw new Error('Empty response from Gemini')
  return content
}

// ── Daily intention ────────────────────────────────────────────────────
export async function generateIntention({ name, mood, weather, events = [] }) {
  const displayName = name || 'you'
  const moodLine = mood ? `Their current mood is: ${mood}.` : ''
  const weatherLine = weather ? `Today's weather: ${weather}.` : ''
  const eventsLine = events.length > 0
    ? `Their calendar today includes: ${events.slice(0, 5).map(e => e.summary).join(', ')}.`
    : ''

  const prompt =
    `You are a warm, grounded wellness guide. Write a single, beautiful daily intention for ${displayName}.

Context: ${moodLine} ${weatherLine} ${eventsLine}

The intention should be:
- One or two sentences maximum
- Poetic but practical
- Specific to their context (mood, weather, schedule)
- Not generic. Not preachy. Quietly encouraging.
- Written in second person ("You...")

Return only the intention text. No quotes, no explanation.`

  return callGemini({
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 120,
  })
}

// ── Weekly reflection ──────────────────────────────────────────────────
export async function generateSummary({ type, payload }) {
  let prompt = ''

  if (type === 'weekly' || type === 'weekly_patterns') {
    const { name, completionRate, streak, moods, topRitual, skipRitual } = payload
    const displayName = name || 'the user'
    const moodList = moods?.map(m => m.mood).filter(Boolean).join(', ') || 'varied'

    prompt =
      `You are a grounded wellness guide writing a brief weekly reflection for ${displayName}.

Data from the past 7 days:
- Completion rate: ${completionRate ?? 'unknown'}%
- Current streak: ${streak ?? 0} days
- Mood notes: ${moodList}
${topRitual ? `- Best-completed ritual: ${topRitual}` : ''}
${skipRitual ? `- Most skipped ritual: ${skipRitual}` : ''}

Write 2–3 sentences of warm, specific, grounded insight. Notice patterns. Acknowledge what's working. Be honest but not harsh about what isn't. Never be generic.

Return only the paragraph text. No preamble.`
  } else if (type === 'journal') {
    const { entries = [] } = payload
    const text = entries.map(e => `${e.date}: ${e.content?.slice(0, 400)}`).join('\n\n')

    prompt =
      `You are a thoughtful reader of someone's private journal. Summarize the themes, emotional arc, and any recurring concerns or insights from these entries in 3–4 sentences.

Entries:
${text}

Be specific to what was actually written. Warm but clear. No filler phrases. Return only the summary.`
  } else {
    throw new Error(`Unknown summary type: ${type}`)
  }

  return callGemini({
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 250,
  })
}
