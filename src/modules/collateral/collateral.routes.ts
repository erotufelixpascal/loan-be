import { crudRouter } from '../../lib/crud-router';
import { AppDataSource } from '../../config/data-source';
import { Collateral } from '../../entities/collateral.entity';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createCollateralSchema,
  updateCollateralSchema,
} from './collateral.schema';

/**
 * @openapi
 * /collateral:
 *   post:
 *     summary: Create a collateral record
 *     tags: [Collateral]
 *     responses:
 *       201:
 *         description: Created
 *   get:
 *     summary: List collateral records
 *     tags: [Collateral]
 *     responses:
 *       200:
 *         description: OK
 * /collateral/{id}:
 *   get:
 *     summary: Get a collateral record by id
 *     tags: [Collateral]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *   patch:
 *     summary: Update a collateral record by id
 *     tags: [Collateral]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     summary: Remove a collateral record by id
 *     tags: [Collateral]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 */
export const collateralRouter = crudRouter({
  repository: () => AppDataSource.getRepository(Collateral),
  createSchema: createCollateralSchema,
  updateSchema: updateCollateralSchema,
  notFoundMessage: 'Collateral not found',
  guards: {
    create: [requireAuth, requireRole('staff', 'manager')],
    list: [requireAuth, requireRole('staff', 'manager')],
    read: [requireAuth, requireRole('staff', 'manager')],
    update: [requireAuth, requireRole('staff', 'manager')],
    remove: [requireAuth, requireRole('staff', 'manager')],
  },
});
