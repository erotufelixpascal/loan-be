import { z } from 'zod';

export const createPaymentSchema = z.object({
  loanId: z.number().int(),
  scheduleId: z.number().int().nullable().optional(),
  amountPaid: z.number().positive(),
  method: z.string().min(1),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
