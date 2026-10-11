import { Router } from 'express';
import { RoleService } from './role.service';
import { createRoleSchema, updateRoleSchema } from './role.schema';
import { asyncHandler } from '../../middleware/async-handler';
import { HttpError } from '../../middleware/error-handler';

export const roleRouter = Router();
const roleService = new RoleService();

/**
 * @openapi
 * /role:
 *   post:
 *     summary: Create a role
 *     tags: [Role]
 *     responses:
 *       201:
 *         description: Created
 */
roleRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    const role = await roleService.create(parsed.data);
    res.status(201).json(role);
  }),
);

/**
 * @openapi
 * /role:
 *   get:
 *     summary: List roles
 *     tags: [Role]
 *     responses:
 *       200:
 *         description: OK
 */
roleRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await roleService.findAll());
  }),
);

/**
 * @openapi
 * /role/{id}:
 *   get:
 *     summary: Get a role by id
 *     tags: [Role]
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
roleRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await roleService.findOne(+req.params.id));
  }),
);

/**
 * @openapi
 * /role/{id}:
 *   patch:
 *     summary: Update a role by id
 *     tags: [Role]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 */
roleRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    res.json(await roleService.update(+req.params.id, parsed.data));
  }),
);

/**
 * @openapi
 * /role/{id}:
 *   delete:
 *     summary: Remove a role by id
 *     tags: [Role]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 */
roleRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await roleService.remove(+req.params.id);
    res.status(204).send();
  }),
);
