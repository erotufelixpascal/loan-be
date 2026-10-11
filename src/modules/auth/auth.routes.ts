import { Router } from 'express';
import { AuthService } from './auth.service';
import { loginSchema, registerSchema } from './auth.schema';
import { asyncHandler } from '../../middleware/async-handler';
import { HttpError } from '../../middleware/error-handler';

export const authRouter = Router();
const authService = new AuthService();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new client account
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    const result = await authService.register(parsed.data);
    res.status(201).json(result);
  }),
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid email or password
 */
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    const result = await authService.login(parsed.data);
    res.status(200).json(result);
  }),
);
