import { Router, Request, Response, NextFunction } from 'express';
import {
  addMessage,
  getMessagesByConversation,
  getConversationById,
  updateConversationTitle,
} from '../services/db.service.js';
import {
  streamChatCompletion,
  getChatCompletion,
  ChatMessage,
} from '../services/openai.service.js';
import { buildTravelContext } from '../services/travel.service.js';
import { SendMessageBody, ChatMode } from '../types/index.js';

const router = Router();

/** Modes that benefit from real destination data injection */
const TRAVEL_CONTEXT_MODES: ChatMode[] = ['trip_planner', 'destination'];

// POST /chat/stream  — streams response via Server-Sent Events
router.post(
  '/stream',
  async (req: Request, res: Response, next: NextFunction) => {
    let headersAlreadySent = false;

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const {
        conversationId,
        message,
        mode = 'travel',
        destination,
      } = req.body as SendMessageBody;

      if (!conversationId || !message) {
        res
          .status(400)
          .json({ error: 'conversationId and message are required' });
        return;
      }

      const conversation = await getConversationById(conversationId);
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      // Save user message
      await addMessage(conversationId, 'user', message);

      // Build history for OpenAI
      const history = await getMessagesByConversation(conversationId);
      const chatMessages: ChatMessage[] = history.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

      // Fetch real attraction data when destination is provided and mode benefits from it
      let travelContext: string | undefined;
      const targetDestination = destination?.trim();
      if (targetDestination && TRAVEL_CONTEXT_MODES.includes(mode as ChatMode)) {
        console.log(`[travel] Fetching context for: ${targetDestination}`);
        travelContext = (await buildTravelContext(targetDestination)) || undefined;
        if (travelContext) {
          console.log(`[travel] Context injected (${travelContext.length} chars)`);
        }
      }

      // Set SSE headers — after this point errors must be sent as SSE events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
      headersAlreadySent = true;

      await streamChatCompletion(
        chatMessages,
        mode as ChatMode,
        (chunk) => {
          sendEvent('chunk', { text: chunk });
        },
        async (fullText) => {
          // Save assistant message
          await addMessage(conversationId, 'assistant', fullText);

          // Auto-title the conversation from first user message
          if (conversation.title === 'New Chat' && history.length <= 1) {
            const shortTitle =
              message.slice(0, 40) + (message.length > 40 ? '...' : '');
            await updateConversationTitle(conversationId, shortTitle);
          }

          sendEvent('done', { text: fullText });
          res.end();
        },
        travelContext
      );
    } catch (err) {
      if (headersAlreadySent) {
        const message = err instanceof Error ? err.message : 'Stream error';
        console.error('[Stream error]', message);
        try {
          res.write(
            `event: error\ndata: ${JSON.stringify({ error: message })}\n\n`
          );
          res.end();
        } catch {
          // Response may already be destroyed — ignore
        }
      } else {
        next(err);
      }
    }
  }
);

// POST /chat  — non-streaming fallback
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      conversationId,
      message,
      mode = 'travel',
      destination,
    } = req.body as SendMessageBody;

    if (!conversationId || !message) {
      res
        .status(400)
        .json({ error: 'conversationId and message are required' });
      return;
    }

    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    await addMessage(conversationId, 'user', message);

    const history = await getMessagesByConversation(conversationId);
    const chatMessages: ChatMessage[] = history.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    let travelContext: string | undefined;
    const targetDestination = destination?.trim();
    if (targetDestination && TRAVEL_CONTEXT_MODES.includes(mode as ChatMode)) {
      travelContext = (await buildTravelContext(targetDestination)) || undefined;
    }

    const reply = await getChatCompletion(
      chatMessages,
      mode as ChatMode,
      travelContext
    );

    await addMessage(conversationId, 'assistant', reply);

    if (conversation.title === 'New Chat' && history.length <= 1) {
      const shortTitle =
        message.slice(0, 40) + (message.length > 40 ? '...' : '');
      await updateConversationTitle(conversationId, shortTitle);
    }

    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

export default router;
