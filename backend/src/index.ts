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

// Middleware — support comma-separated origins for multi-env deployments
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
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
