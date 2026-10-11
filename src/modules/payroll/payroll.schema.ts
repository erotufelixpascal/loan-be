import { z } from 'zod';

export const createPayrollSchema = z.object({
  staffId: z.number().int(),
  period: z.string().min(1),
  baseSalary: z.number(),
  commission: z.number().default(0),
  deductions: z.number().default(0),
});

// netPay is computed server-side (baseSalary + commission - deductions) and
// is intentionally not accepted from the client.
export const updatePayrollSchema = z.object({
  status: z.enum(['pending', 'paid']),
});

export type CreatePayrollInput = z.infer<typeof createPayrollSchema>;
export type UpdatePayrollInput = z.infer<typeof updatePayrollSchema>;
