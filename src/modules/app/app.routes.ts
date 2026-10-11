import { Router } from 'express';

export const appRouter = Router();

/**
 * @openapi
 * /:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Service is up
 */
appRouter.get('/', (req, res) => {
  res.send('Hello World!');
});
