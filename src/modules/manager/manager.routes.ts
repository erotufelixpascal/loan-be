import { Router } from 'express';
import { AppDataSource } from '../../config/data-source';
import { ManagerService } from './manager.service';
import { asyncHandler } from '../../middleware/async-handler';

export const managerRouter = Router();
const managerService = new ManagerService();

/**
 * @openapi
 * /manager:
 *   post:
 *     summary: Create a manager
 *     tags: [Manager]
 *     responses:
 *       201:
 *         description: Created
 */
managerRouter.post('/', (req, res) => {
  res.status(201).json(managerService.create());
});

/**
 * @openapi
 * /manager:
 *   get:
 *     summary: List managers
 *     tags: [Manager]
 *     responses:
 *       200:
 *         description: OK
 */
managerRouter.get('/', (req, res) => {
  res.json(managerService.findAll());
});

/**
 * @openapi
 * /manager/Test_db:
 *   get:
 *     summary: Verify the database connection
 *     tags: [Manager]
 *     responses:
 *       200:
 *         description: Connection result
 */
managerRouter.get(
  '/Test_db',
  asyncHandler(async (req, res) => {
    try {
      await AppDataSource.query('select * from role');
      res.json({ message: 'Database connection successful' });
    } catch (error) {
      res.json({
        message: 'Database connection failed',
        error: (error as Error).message,
      });
    }
  }),
);

/**
 * @openapi
 * /manager/{id}:
 *   get:
 *     summary: Get a manager by id
 *     tags: [Manager]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 */
managerRouter.get('/:id', (req, res) => {
  res.json(managerService.findOne(+req.params.id));
});

/**
 * @openapi
 * /manager/{id}:
 *   patch:
 *     summary: Update a manager by id
 *     tags: [Manager]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 */
managerRouter.patch('/:id', (req, res) => {
  res.json(managerService.update(+req.params.id));
});

/**
 * @openapi
 * /manager/{id}:
 *   delete:
 *     summary: Remove a manager by id
 *     tags: [Manager]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 */
managerRouter.delete('/:id', (req, res) => {
  res.json(managerService.remove(+req.params.id));
});
