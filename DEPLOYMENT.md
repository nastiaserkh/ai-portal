# Deployment Guide — Travel AI Portal

**Stack summary:**
- Backend → Render Web Service (Docker, free tier — sleeps after 15 min of inactivity)
- Frontend → Render Static Site (free, always on, global CDN)
- AI → Google Gemini 2.5 Flash (free tier via OpenAI-compatible endpoint)
- Travel data → REST Countries + Teleport (both free, no API key needed)
- Database → SQLite in `/tmp` (ephemeral — resets on redeploy; see [Persistent DB](#optional-persistent-database-neon-postgresql) to avoid this)

## Step 1 — Create a Render account

Go to [render.com](https://render.com) and sign up. Connect your GitHub account when prompted.

---

## Step 2 — Deploy the backend (Web Service)

1. In the Render dashboard click **New → Web Service**
2. Select your `ai-portal` repository
3. Fill in the settings:

| Field | Value |
|---|---|
| **Name** | `ai-portal-backend` |
| **Language** | `Docker` |
| **Root Directory** | `backend` |
| **Dockerfile Path** | `./Dockerfile` |
| **Instance Type** | `Free` |
| **Health Check Path** | `/health` |

> Render will automatically use the `backend/Dockerfile` to build and run the container. The `CMD` in the Dockerfile already runs `prisma db push` before starting the server — no extra start command needed.

4. Scroll down to **Environment Variables** and add:

| Key | Value |
|---|---|
| `DATABASE_URL` | your Neon connection string, e.g. `postgresql://neondb_owner:...@....neon.tech/neondb?sslmode=require` |
| `GEMINI_API_KEY` | your Gemini key (from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)) |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `FRONTEND_URL` | leave blank for now — you'll fill this in Step 5 |

5. Click **Create Web Service** and wait for the Docker build to finish (~3–5 min)
6. Copy the backend URL shown at the top, e.g. `https://ai-portal-backend.onrender.com`

---

## Step 3 — Deploy the frontend (Static Site)

1. In the Render dashboard click **New → Static Site**
2. Select the same `ai-portal` repository
3. Fill in the settings:

| Field | Value |
|---|---|
| **Name** | `ai-portal-frontend` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. Under **Environment Variables** click **Add Environment Variable** and add:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | your backend URL from Step 3, e.g. `https://ai-portal-backend.onrender.com` |

> **Tip:** you can also click **Add from .env** and paste the contents of your local `.env` file to bulk-import variables.

5. Click **Create Static Site** and wait for the build (~1–2 min)
6. Copy the frontend URL, e.g. `https://ai-portal-frontend.onrender.com`

> **SPA routing** (React Router) is handled automatically by the `frontend/public/_redirects` file already in the repo — no extra Render configuration needed.

---

## Step 4 — Wire the two services together

Now that both URLs are known, link them.

**Update backend CORS:**
1. Go to `ai-portal-backend` → **Environment**
2. Set `FRONTEND_URL` = `https://ai-portal-frontend.onrender.com`
3. Click **Save Changes** — Render redeploys automatically

**Verify:**
- Open `https://ai-portal-frontend.onrender.com` in your browser
- The Travel AI Portal should load and chat should work

---

## Free tier behaviour to know

| Limitation | Detail |
|---|---|
| **Backend sleeps** | After 15 min of no traffic the container spins down. The first request after sleep takes ~30 sec to wake up. |
| **Database** | Neon PostgreSQL — conversations persist across redeployments. ✓ |
| **Build minutes** | Free tier includes 500 build-minutes/month. The Docker build is ~3 min, so ~160 deploys/month. |
| **Gemini free tier** | 15 requests/min, 1 500 requests/day on `gemini-2.5-flash`. More than enough for a demo or student project. |

---

## Local development

```bash
# From the ai-portal project root
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health check | http://localhost:3001/health |
