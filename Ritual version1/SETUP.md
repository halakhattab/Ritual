# Ritual — Setup Guide

## 1. Install dependencies

```bash
npm install
```

## 2. Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase/schema.sql`
3. In Authentication → Providers, enable **Email** and optionally **Google**
4. Copy your Project URL and anon key from Settings → API

## 3. Environment variables

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Calendar (optional)
VITE_GOOGLE_CLIENT_ID=your-oauth-client-id
```

The `ANTHROPIC_API_KEY` is **not** in `.env` — it lives only in Supabase Edge Function secrets (see step 4).

## 4. Deploy the ai-proxy Edge Function

Install the Supabase CLI if you haven't:

```bash
brew install supabase/tap/supabase   # or: npm install -g supabase
```

Link your project and push the secret + function:

```bash
supabase login
supabase link --project-ref your-project-ref

# Store the secret server-side only — never in .env
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Deploy the edge function
supabase functions deploy ai-proxy
```

The function lives at `supabase/functions/ai-proxy/index.ts`. It:
- Verifies the caller's Supabase JWT before doing anything
- Accepts `{ system?, messages, max_tokens? }` in the request body
- Calls the Anthropic API using the server-side secret
- Returns `{ content }`

To redeploy after changes:
```bash
supabase functions deploy ai-proxy
```

## 5. Claude API

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Store it with `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` (step 4)
3. The app uses `claude-sonnet-4-20250514` via the `ai-proxy` edge function

All prompt-building happens in `src/lib/claude.js`. The edge function is a generic authenticated proxy — it never touches business logic.

## 6. Google Calendar (optional)

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the Google Calendar API
3. Create an OAuth 2.0 client ID (Web application type)
4. Add your domain to Authorized redirect URIs (e.g. `http://localhost:5173/settings`)
5. Add `VITE_GOOGLE_CLIENT_ID` to your `.env`

Users connect their calendar in Settings → Integrations.

## 7. Run locally

```bash
npm run dev
```

To test the edge function locally alongside the dev server:

```bash
supabase functions serve ai-proxy --env-file .env.local
```

Create `.env.local` with `ANTHROPIC_API_KEY=sk-ant-...` for local function testing.

## 8. Deploy frontend to Vercel

```bash
npm install -g vercel
vercel
```

Add only the two public variables in Vercel → Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_CLIENT_ID` (if using calendar)

`ANTHROPIC_API_KEY` stays in Supabase only — Vercel never needs it.

## Architecture

```
src/
├── pages/          # Today, Patterns, Rituals, Reflect, Settings, Auth
├── components/
│   ├── today/      # Greeting, Intention, WeatherStrip, MoodCheckIn, etc.
│   ├── patterns/   # StreakChart, CompletionHeatmap, MoodChart
│   └── rituals/    # RitualForm, RitualItem
├── contexts/       # AuthContext (Supabase auth state)
├── hooks/          # useWeather, useRituals, useTodayLogs, useMoodLog
└── lib/
    ├── supabase.js # Supabase client
    └── claude.js   # Prompt builders → supabase.functions.invoke('ai-proxy')

supabase/
├── functions/
│   └── ai-proxy/
│       └── index.ts  # Deno edge function — JWT auth + Anthropic proxy
├── schema.sql        # Full DB schema with RLS policies
└── config.toml       # Local dev config
```
