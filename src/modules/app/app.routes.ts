import { Router } from 'express';

export const appRouter = Router();

// Mounted at the bare root, not under /api, so it's left out of the Swagger
// doc rather than fighting the global `servers: [{ url: '/api' }]` override.
appRouter.get('/', (req, res) => {
  res.send('Hello World!');
});
