# Ritual — Daily Intention Generator

> An AI-powered wellness app that generates personalized daily intentions 
> and ritual plans based on your mood and needs.

**Built by [Hala Khattab](https://www.linkedin.com/in/hala-khattab-8b28442b)**  
🌐 **[Live Site](https://ritual-3ru.pages.dev)**

---

## Stack

- React + Vite
- Framer Motion (animations)
- Google Fonts — Cormorant Garamond + DM Sans
- html2canvas (save-as-image)
- Cloudflare Pages (hosting)
- Cloudflare Worker (API proxy)

---

## Local Development

```bash
npm install

# Create a local .env file from the example
cp .env.example .env.local
# Edit .env.local and set VITE_PROXY_URL to your Worker URL

npm run dev
```

---

## Deploying to Cloudflare Pages

### 1. Push your code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/ritual.git
git push -u origin main
```

### 2. Connect to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages → Create application → Pages → Connect to Git**
3. Select your repository
4. Configure the build:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

### 3. Set Environment Variables

In your Pages project settings → **Environment variables → Production**:

| Variable | Value |
|---|---|
| `VITE_PROXY_URL` | `https://your-worker.your-subdomain.workers.dev` |

> Note: Vite bakes environment variables into the bundle at build time. After setting the variable, trigger a new deployment for it to take effect.

### 4. Deploy

Cloudflare Pages will auto-deploy on every push to `main`.

---

## Cloudflare Worker (API Proxy)

Your Worker should forward requests to the Anthropic API. Example Worker:

```js
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    const body = await request.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  },
}
```

Set `ANTHROPIC_API_KEY` as a secret in your Worker's settings.

---

## Rate Limiting

The app enforces a 30-second client-side cooldown after each generation, stored in `localStorage`. This prevents rapid accidental API calls. The cooldown persists across page refreshes.
