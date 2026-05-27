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
import { SendMessageBody, ChatMode } from '../types/index.js';

const router = Router();

// POST /chat/stream  — streams response via Server-Sent Events
router.post(
  '/stream',
  async (req: Request, res: Response, next: NextFunction) => {
    let headersAlreadySent = false;

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const { conversationId, message, mode = 'general' } =
        req.body as SendMessageBody;

      if (!conversationId || !message) {
        res.status(400).json({ error: 'conversationId and message are required' });
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
        }
      );
    } catch (err) {
      if (headersAlreadySent) {
        // Headers already sent — can't return a normal error response.
        // Send an error event over SSE so the client knows something went wrong.
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
    const { conversationId, message, mode = 'general' } =
      req.body as SendMessageBody;

    if (!conversationId || !message) {
      res.status(400).json({ error: 'conversationId and message are required' });
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

    const reply = await getChatCompletion(chatMessages, mode as ChatMode);

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
