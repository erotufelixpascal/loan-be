import { crudRouter } from '../../lib/crud-router';
import { AppDataSource } from '../../config/data-source';
import { LoanCategory } from '../../entities/loan-category.entity';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createLoanCategorySchema,
  updateLoanCategorySchema,
} from './loan-category.schema';

/**
 * @openapi
 * /loan-categories:
 *   post:
 *     summary: Create a loan category
 *     tags: [LoanCategories]
 *     responses:
 *       201:
 *         description: Created
 *   get:
 *     summary: List loan categories
 *     tags: [LoanCategories]
 *     responses:
 *       200:
 *         description: OK
 * /loan-categories/{id}:
 *   get:
 *     summary: Get a loan category by id
 *     tags: [LoanCategories]
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
 *     summary: Update a loan category by id
 *     tags: [LoanCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     summary: Remove a loan category by id
 *     tags: [LoanCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 */
export const loanCategoryRouter = crudRouter({
  repository: () => AppDataSource.getRepository(LoanCategory),
  createSchema: createLoanCategorySchema,
  updateSchema: updateLoanCategorySchema,
  notFoundMessage: 'Loan category not found',
  guards: {
    create: [requireAuth, requireRole('manager')],
    list: [requireAuth],
    read: [requireAuth],
    update: [requireAuth, requireRole('manager')],
    remove: [requireAuth, requireRole('manager')],
  },
});
