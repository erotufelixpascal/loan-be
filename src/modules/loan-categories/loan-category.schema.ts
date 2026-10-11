import { z } from 'zod';

export const createLoanCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).nullable().optional(),
  interestRateMin: z.number(),
  interestRateMax: z.number(),
  termMinMonths: z.number().int(),
  termMaxMonths: z.number().int(),
  collateralRequired: z.boolean().default(false),
});

export const updateLoanCategorySchema = createLoanCategorySchema.partial();

export type CreateLoanCategoryInput = z.infer<typeof createLoanCategorySchema>;
export type UpdateLoanCategoryInput = z.infer<typeof updateLoanCategorySchema>;
