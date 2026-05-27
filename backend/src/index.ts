import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import healthRouter from './routes/health.js';
import conversationsRouter from './routes/conversations.js';
import chatRouter from './routes/chat.js';
import travelRouter from './routes/travel.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────────────────────────
// FRONTEND_URL accepts:
//   • A single origin:          https://ai-portal-frontend.onrender.com
//   • Comma-separated origins:  https://foo.onrender.com,http://localhost:5173
//   • Wildcard (open access):   *   ← useful during initial Render setup / testing
const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowAllOrigins = rawFrontendUrl.trim() === '*';
const allowedOrigins = allowAllOrigins
  ? []
  : rawFrontendUrl.split(',').map((s) => s.trim());

if (allowAllOrigins) {
  console.warn('[CORS] FRONTEND_URL=* — all origins are allowed. Set a specific URL for production.');
} else {
  console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
}

app.use(
  cors({
    origin: allowAllOrigins
      ? '*'
      : (origin, callback) => {
          // Allow requests with no origin (curl, Postman, server-to-server)
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            console.warn(`[CORS] Blocked request from origin: ${origin}`);
            callback(new Error(`CORS: origin ${origin} not allowed`));
          }
        },
  })
);
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/conversations', conversationsRouter);
app.use('/chat', chatRouter);
app.use('/travel', travelRouter);

// 404 + error handlers
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Travel AI Portal backend running on http://localhost:${PORT} (Gemini ${process.env.GEMINI_MODEL || 'gemini-1.5-flash'})`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
