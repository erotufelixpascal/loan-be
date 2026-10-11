import { Router } from 'express';
import { PaymentService } from './payment.service';
import { createPaymentSchema } from './payment.schema';
import { asyncHandler } from '../../middleware/async-handler';
import { HttpError } from '../../middleware/error-handler';
import { requireAuth, requireRole } from '../../middleware/auth';
import { AppDataSource } from '../../config/data-source';
import { Payment } from '../../entities/payment.entity';

export const paymentRouter = Router();
const paymentService = new PaymentService();

/**
 * @openapi
 * /payments:
 *   post:
 *     summary: Record a payment against a loan (client or staff)
 *     tags: [Payments]
 *     responses:
 *       201:
 *         description: Created
 *       404:
 *         description: Loan not found
 */
paymentRouter.post(
  '/',
  requireAuth,
  requireRole('client', 'staff'),
  asyncHandler(async (req, res) => {
    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    const payment = await paymentService.create(req.user!.id, parsed.data);
    res.status(201).json(payment);
  }),
);

/**
 * @openapi
 * /payments:
 *   get:
 *     summary: List all payments (staff/manager only)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: OK
 */
paymentRouter.get(
  '/',
  requireAuth,
  requireRole('staff', 'manager'),
  asyncHandler(async (req, res) => {
    res.json(await AppDataSource.getRepository(Payment).find());
  }),
);
