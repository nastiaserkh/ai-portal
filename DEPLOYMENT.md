# Deployment Guide

## Step 1 — Push the project to GitHub

Render deploys from a Git repository. You need to push the project to GitHub first.

> **Note:** The `.gitignore` already excludes `.env`, `node_modules/`, `dist/`, and database files — your API key will not be uploaded.

1. Go to [github.com](https://github.com) → **New repository**
2. Name it (e.g. `ai-portal`), set it to **Private**, click **Create repository**
3. In a terminal, inside the project folder (`C:\лолітех\Настіне\хмарні технології`), run:

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

| Field              | Value                                                 |
| ------------------ | ----------------------------------------------------- |
| **Name**           | `ai-portal-backend`                                   |
| **Root Directory** | `backend`                                             |
| **Runtime**        | `Node`                                                |
| **Build Command**  | `npm install && npx prisma generate && npm run build` |
| **Start Command**  | `npx prisma db push && node dist/index.js`            |
| **Instance Type**  | `Free`                                                |

4. Scroll down to **Environment Variables** and add:

| Key              | Value                                            |
| ---------------- | ------------------------------------------------ |
| `DATABASE_URL`   | `file:/tmp/ai-portal.db`                         |
| `OPENAI_API_KEY` | your OpenAI key (e.g. `sk-proj-...`)             |
| `OPENAI_MODEL`   | `gpt-4o`                                         |
| `FRONTEND_URL`   | leave blank for now (you'll fill this in Step 5) |

5. Click **Create Web Service** and wait for the build to finish (~2–3 min)
6. Copy the backend URL shown at the top, e.g. `https://ai-portal-backend.onrender.com`

---

## Step 4 — Deploy the frontend (Static Site)

1. In the Render dashboard click **New → Static Site**
2. Select the same `ai-portal` repository
3. Fill in the settings:

| Field                 | Value                          |
| --------------------- | ------------------------------ |
| **Name**              | `ai-portal-frontend`           |
| **Root Directory**    | `frontend`                     |
| **Build Command**     | `npm install && npm run build` |
| **Publish Directory** | `dist`                         |

4. Add an **Environment Variable**:

| Key                 | Value                                                                             |
| ------------------- | --------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | your backend URL from Step 6 above, e.g. `https://ai-portal-backend.onrender.com` |

5. Under **Redirect/Rewrite Rules** add:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Type:** `Rewrite`
     _(This makes React Router work on page refresh.)_

6. Click **Create Static Site** and wait for the build (~1–2 min)
7. Copy the frontend URL, e.g. `https://ai-portal-frontend.onrender.com`

---

## Step 5 — Wire the two services together

Now that both URLs are known, update each service with the other's URL.

**Update backend CORS:**

1. Go to the `ai-portal-backend` service → **Environment**
2. Set `FRONTEND_URL` = `https://ai-portal-frontend.onrender.com`
3. Click **Save Changes** — Render will redeploy automatically

**Verify:**

- Open `https://ai-portal-frontend.onrender.com` in your browser
- The app should load and chat should work

---

## Free tier behaviour to know

| Limitation          | Detail                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Backend sleeps**  | After 15 min of no traffic the service spins down. The first request takes ~30 sec to wake up.                                 |
| **Database resets** | SQLite lives in `/tmp` which is wiped on every redeploy. Conversations are lost when you push new code. See below to fix this. |
| **Build minutes**   | Free tier includes 500 build-minutes/month, enough for frequent deploys.                                                       |

---

## Optional: Persistent database (Neon PostgreSQL)

If you want conversations to survive redeployments, replace SQLite with a free PostgreSQL database from [Neon](https://neon.tech).

### 1. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech) (free, no credit card)
2. Create a new project → copy the **Connection string**, e.g.:
   `postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require`

### 2. Update Prisma schema

In `backend/prisma/schema.prisma`, change the datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Update Render environment variable

In `ai-portal-backend` → Environment, change:

| Key            | Value                       |
| -------------- | --------------------------- |
| `DATABASE_URL` | your Neon connection string |

### 4. Update start command

Change the Render **Start Command** to:

```
npx prisma migrate deploy && node dist/index.js
```

Push the schema change to GitHub — Render will redeploy and connect to Neon automatically.

---

## Local development (unchanged)

```bash
# From the project root
docker compose up --build
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001
