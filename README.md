# AI Portal

A general-purpose AI portal powered by ChatGPT API.
**Stack:** React + Vite + TypeScript | Node.js + Express | OpenAI API | SQLite + Prisma

---

## Quick Start (Local Development)

### 1. Clone and set up environment variables

```bash
# Copy and fill in your OpenAI API key
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:
```
PORT=3001
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o
```

### 2a. Run with Docker Compose (easiest)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:3001/health

### 2b. Run manually (for development)

**Backend:**
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

**Frontend** (in a new terminal):
```bash
cd frontend
npm install
npm run dev
```

---

## Project Structure

```
ai-portal/
├── backend/          # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/   # health, conversations, chat
│   │   ├── services/ # openai.service, db.service
│   │   └── types/
│   └── prisma/       # SQLite schema
├── frontend/         # React + Vite + TypeScript
│   └── src/
│       ├── pages/    # Home, Chat, Tools
│       ├── components/
│       └── services/ # API service layer
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/conversations` | List all conversations |
| POST | `/conversations` | Create conversation |
| GET | `/conversations/:id` | Get conversation + messages |
| DELETE | `/conversations/:id` | Delete conversation |
| POST | `/chat` | Send message (JSON response) |
| POST | `/chat/stream` | Send message (SSE streaming) |

## AI Modes

| Mode | Description |
|------|-------------|
| `general` | General-purpose assistant |
| `code` | Software engineering expert |
| `summarizer` | Text summarization |
| `writing` | Writing improvement assistant |
