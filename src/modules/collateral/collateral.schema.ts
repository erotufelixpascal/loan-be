import { z } from 'zod';

export const createCollateralSchema = z.object({
  applicationId: z.number().int(),
  description: z.string().min(1),
  estimatedValue: z.number(),
  documentUrl: z.string().min(1).nullable().optional(),
});

export const updateCollateralSchema = createCollateralSchema.partial();

export type CreateCollateralInput = z.infer<typeof createCollateralSchema>;
export type UpdateCollateralInput = z.infer<typeof updateCollateralSchema>;
