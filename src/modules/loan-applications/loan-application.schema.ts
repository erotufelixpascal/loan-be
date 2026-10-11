import { z } from 'zod';

export const createLoanApplicationSchema = z.object({
  categoryId: z.number().int(),
  amount: z.number().positive(),
  term: z.number().int().positive(),
  reason: z.string().min(1),
});

export const decisionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comment: z.string().optional(),
});

export type CreateLoanApplicationInput = z.infer<
  typeof createLoanApplicationSchema
>;
export type DecisionInput = z.infer<typeof decisionSchema>;
