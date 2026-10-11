import { Router } from 'express';
import { UserService } from './user.service';
import { createUserSchema, updateUserSchema } from './user.schema';
import { asyncHandler } from '../../middleware/async-handler';
import { HttpError } from '../../middleware/error-handler';
import {
  requireAuth,
  requireRole,
  requireSelfOrRole,
} from '../../middleware/auth';
import { UserRole } from '../../entities/user.entity';

export const userRouter = Router();
const userService = new UserService();

const USER_ROLES: UserRole[] = ['client', 'staff', 'manager'];

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create a staff, client, or manager account (manager only)
 *     tags: [Users]
 *     responses:
 *       201:
 *         description: Created
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Email already registered
 */
userRouter.post(
  '/',
  requireAuth,
  requireRole('manager'),
  asyncHandler(async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    const user = await userService.create(parsed.data);
    res.status(201).json(user);
  }),
);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List users, optionally filtered by role (manager only)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: role
 *         required: false
 *         schema: { type: string, enum: [client, staff, manager] }
 *     responses:
 *       200:
 *         description: OK
 *       403:
 *         description: Forbidden
 */
userRouter.get(
  '/',
  requireAuth,
  requireRole('manager'),
  asyncHandler(async (req, res) => {
    const { role } = req.query;
    if (role !== undefined && !USER_ROLES.includes(role as UserRole)) {
      throw new HttpError(400, 'Invalid role filter');
    }
    res.json(await userService.findAll(role as UserRole | undefined));
  }),
);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get a user by id (self or manager)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 */
userRouter.get(
  '/:id',
  requireAuth,
  requireSelfOrRole((req) => +req.params.id, 'manager'),
  asyncHandler(async (req, res) => {
    res.json(await userService.findOne(+req.params.id));
  }),
);

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     summary: Update a user's profile (self or manager)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 */
userRouter.patch(
  '/:id',
  requireAuth,
  requireSelfOrRole((req) => +req.params.id, 'manager'),
  asyncHandler(async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    // Self-edits are limited to name/phone; changing email, role, or branch requires a manager.
    const payload =
      req.user?.role === 'manager'
        ? parsed.data
        : {
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            phone: parsed.data.phone,
          };
    res.json(await userService.update(+req.params.id, payload));
  }),
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Remove a user (manager only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: No content
 */
userRouter.delete(
  '/:id',
  requireAuth,
  requireRole('manager'),
  asyncHandler(async (req, res) => {
    await userService.remove(+req.params.id);
    res.status(204).send();
  }),
);
