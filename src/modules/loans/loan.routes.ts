import { Router } from 'express';
import { LoanService } from './loan.service';
import { asyncHandler } from '../../middleware/async-handler';
import { requireAuth } from '../../middleware/auth';
import { LoanStatus } from '../../entities/loan.entity';

export const loanRouter = Router();
const loanService = new LoanService();

const VALID_STATUSES: LoanStatus[] = ['active', 'closed', 'defaulted'];

/**
 * @openapi
 * /loans:
 *   get:
 *     summary: List loans (clients see only their own). Supports ?status= filtering.
 *     tags: [Loans]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema: { type: string, enum: [active, closed, defaulted] }
 *     responses:
 *       200:
 *         description: OK
 */
loanRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const statusParam = req.query.status as string | undefined;
    const status = VALID_STATUSES.includes(statusParam as LoanStatus)
      ? (statusParam as LoanStatus)
      : undefined;
    res.json(await loanService.findAllForUser(req.user!, status));
  }),
);

/**
 * @openapi
 * /loans/{id}:
 *   get:
 *     summary: Get a loan by id
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
loanRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await loanService.findOne(+req.params.id, req.user!));
  }),
);

/**
 * @openapi
 * /loans/{id}/schedule:
 *   get:
 *     summary: Get the repayment schedule for a loan
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
loanRouter.get(
  '/:id/schedule',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await loanService.getSchedule(+req.params.id, req.user!));
  }),
);
