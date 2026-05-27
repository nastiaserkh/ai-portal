import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllConversations,
  getConversationById,
  createConversation,
  deleteConversation,
} from '../services/db.service.js';
import { CreateConversationBody } from '../types/index.js';

const router = Router();

// GET /conversations
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const conversations = await getAllConversations();
    res.json(conversations);
  } catch (err) {
    next(err);
  }
});

// GET /conversations/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await getConversationById(req.params.id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json(conversation);
  } catch (err) {
    next(err);
  }
});

// POST /conversations
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title = 'New Chat', mode = 'travel' } =
      req.body as CreateConversationBody;
    const conversation = await createConversation(title, mode);
    res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
});

// DELETE /conversations/:id
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteConversation(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
