import { Router } from 'express';
import { LoanApplicationService } from './loan-application.service';
import {
  createLoanApplicationSchema,
  decisionSchema,
} from './loan-application.schema';
import { asyncHandler } from '../../middleware/async-handler';
import { HttpError } from '../../middleware/error-handler';
import { requireAuth, requireRole } from '../../middleware/auth';

export const loanApplicationRouter = Router();
const loanApplicationService = new LoanApplicationService();

/**
 * @openapi
 * /loan-applications:
 *   post:
 *     summary: Submit a loan application (client only)
 *     tags: [LoanApplications]
 *     responses:
 *       201:
 *         description: Created
 */
loanApplicationRouter.post(
  '/',
  requireAuth,
  requireRole('client'),
  asyncHandler(async (req, res) => {
    const parsed = createLoanApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    const application = await loanApplicationService.create(
      req.user!.id,
      parsed.data,
    );
    res.status(201).json(application);
  }),
);

/**
 * @openapi
 * /loan-applications:
 *   get:
 *     summary: List loan applications (clients see only their own)
 *     tags: [LoanApplications]
 *     responses:
 *       200:
 *         description: OK
 */
loanApplicationRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await loanApplicationService.findAllForUser(req.user!));
  }),
);

/**
 * @openapi
 * /loan-applications/{id}:
 *   get:
 *     summary: Get a loan application by id
 *     tags: [LoanApplications]
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
loanApplicationRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const application = await loanApplicationService.findOne(+req.params.id);
    if (
      req.user!.role === 'client' &&
      application.customerId !== req.user!.id
    ) {
      throw new HttpError(
        403,
        'You do not have permission to view this application',
      );
    }
    res.json(application);
  }),
);

/**
 * @openapi
 * /loan-applications/{id}/decision:
 *   patch:
 *     summary: Approve or reject a loan application (staff/manager). Approval auto-disburses the loan.
 *     tags: [LoanApplications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *       409:
 *         description: Application already decided
 */
loanApplicationRouter.patch(
  '/:id/decision',
  requireAuth,
  requireRole('staff', 'manager'),
  asyncHandler(async (req, res) => {
    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    const application = await loanApplicationService.decide(
      +req.params.id,
      req.user!.id,
      parsed.data,
    );
    res.json(application);
  }),
);
