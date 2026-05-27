# Deployment Guide — Travel AI Portal on Render (free)

This guide deploys the Travel AI Portal to [Render](https://render.com) at no cost.

**Stack summary:**
- Backend → Render Web Service (Docker, free tier — sleeps after 15 min of inactivity)
- Frontend → Render Static Site (free, always on, global CDN)
- AI → Google Gemini 2.5 Flash (free tier via OpenAI-compatible endpoint)
- Travel data → REST Countries + Teleport (both free, no API key needed)
- Database → SQLite in `/tmp` (ephemeral — resets on redeploy; see [Persistent DB](#optional-persistent-database-neon-postgresql) to avoid this)

---

## Step 1 — Push the project to GitHub

Render deploys from a Git repository.

> **Note:** The `.gitignore` already excludes `.env`, `node_modules/`, `dist/`, and database files — your API key will not be uploaded.

1. Go to [github.com](https://github.com) → **New repository**
2. Name it (e.g. `ai-portal`), set it to **Private**, click **Create repository**
3. In a terminal, inside `C:\лолітех\Настіне\хмарні технології\ai-portal`, run:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ai-portal.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Create a Render account

Go to [render.com](https://render.com) and sign up (free, no credit card required). Connect your GitHub account when prompted.

---

## Step 3 — Deploy the backend (Web Service)

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

## Step 4 — Deploy the frontend (Static Site)

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

## Step 5 — Lock down CORS for production

The backend starts with `FRONTEND_URL=*` (open access) so the first deploy works.
Once the frontend is deployed and you have its URL, tighten CORS:

1. Go to `ai-portal-backend` → **Environment**
2. Change `FRONTEND_URL` from `*` to your exact frontend URL, e.g.:
   `https://ai-portal-frontend.onrender.com`
3. Click **Save Changes** — Render redeploys automatically (~1 min)

> **If you get a CORS error during testing**, check the backend logs in the Render dashboard — the backend prints `[CORS] Blocked request from origin: <url>` which shows you exactly what URL to put in `FRONTEND_URL`.

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
