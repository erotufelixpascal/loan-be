import { Router } from 'express';
import { PayrollService } from './payroll.service';
import { createPayrollSchema, updatePayrollSchema } from './payroll.schema';
import { asyncHandler } from '../../middleware/async-handler';
import { HttpError } from '../../middleware/error-handler';
import { requireAuth, requireRole } from '../../middleware/auth';

export const payrollRouter = Router();
const payrollService = new PayrollService();

// Payroll is manager-only end to end: staff/clients never see salary data.
payrollRouter.use(requireAuth, requireRole('manager'));

/**
 * @openapi
 * /payroll:
 *   post:
 *     summary: Create a payroll record (netPay is computed server-side)
 *     tags: [Payroll]
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
payrollRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createPayrollSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    const payroll = await payrollService.create(parsed.data);
    res.status(201).json(payroll);
  }),
);

/**
 * @openapi
 * /payroll:
 *   get:
 *     summary: List payroll records
 *     tags: [Payroll]
 *     responses:
 *       200:
 *         description: OK
 *       403:
 *         description: Forbidden
 */
payrollRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await payrollService.findAll());
  }),
);

/**
 * @openapi
 * /payroll/{id}:
 *   get:
 *     summary: Get a payroll record by id
 *     tags: [Payroll]
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
payrollRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await payrollService.findOne(+req.params.id));
  }),
);

/**
 * @openapi
 * /payroll/{id}:
 *   patch:
 *     summary: Mark a payroll record's status (e.g. pending -> paid)
 *     tags: [Payroll]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
payrollRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = updatePayrollSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    const payroll = await payrollService.markStatus(
      +req.params.id,
      parsed.data.status,
    );
    res.json(payroll);
  }),
);
