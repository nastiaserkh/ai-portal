import { Router, Request, Response, NextFunction } from 'express';
import { getDestinationInfo } from '../services/travel.service.js';

const router = Router();

/**
 * GET /travel/destination?q=Paris
 * Returns country facts (REST Countries) + city quality scores (Teleport).
 * No API key required — both sources are free and open.
 */
router.get(
  '/destination',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = (req.query.q as string)?.trim();
      if (!q) {
        res.status(400).json({ error: 'q query param is required' });
        return;
      }

      const result = await getDestinationInfo(q);

      if (!result.country && !result.city) {
        res.status(404).json({
          error: `No data found for "${q}". Try a country name (France, Japan) or major city (Tokyo, Paris).`,
        });
        return;
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
