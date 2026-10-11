import { z } from 'zod';

export const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['client', 'staff', 'manager']),
  branch: z.string().nullable().optional(),
});

// Profile edits shouldn't silently reset the password, so it is intentionally
// omitted here rather than made optional.
export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
