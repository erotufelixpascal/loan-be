import { Router, RequestHandler } from 'express';
import { ObjectLiteral, Repository } from 'typeorm';
import { ZodSchema } from 'zod';
import { asyncHandler } from '../middleware/async-handler';
import { HttpError } from '../middleware/error-handler';

interface CrudRouterOptions<T extends ObjectLiteral> {
  repository: () => Repository<T>;
  createSchema: ZodSchema;
  updateSchema: ZodSchema;
  notFoundMessage?: string;
  // Optional guards applied to each verb; omit a key to leave that verb open.
  guards?: Partial<Record<'create' | 'list' | 'read' | 'update' | 'remove', RequestHandler[]>>;
}

/**
 * Builds a conventional REST router (POST/GET/GET:id/PATCH:id/DELETE:id) for a
 * single TypeORM entity. Use this for straightforward CRUD resources; reach
 * for a hand-written router when a resource needs custom sub-routes or
 * side effects beyond save/find/delete.
 */
export function crudRouter<T extends ObjectLiteral>(options: CrudRouterOptions<T>): Router {
  const router = Router();
  const { repository, createSchema, updateSchema, notFoundMessage = 'Not found', guards = {} } = options;

  router.post(
    '/',
    ...(guards.create ?? []),
    asyncHandler(async (req, res) => {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, parsed.error.message);
      const saved = await repository().save(parsed.data);
      res.status(201).json(saved);
    }),
  );

  router.get(
    '/',
    ...(guards.list ?? []),
    asyncHandler(async (req, res) => {
      res.json(await repository().find());
    }),
  );

  router.get(
    '/:id',
    ...(guards.read ?? []),
    asyncHandler(async (req, res) => {
      const item = await repository().findOne({ where: { id: +req.params.id } as never });
      if (!item) throw new HttpError(404, notFoundMessage);
      res.json(item);
    }),
  );

  router.patch(
    '/:id',
    ...(guards.update ?? []),
    asyncHandler(async (req, res) => {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, parsed.error.message);
      const existing = await repository().findOne({ where: { id: +req.params.id } as never });
      if (!existing) throw new HttpError(404, notFoundMessage);
      const saved = await repository().save({ ...existing, ...parsed.data });
      res.json(saved);
    }),
  );

  router.delete(
    '/:id',
    ...(guards.remove ?? []),
    asyncHandler(async (req, res) => {
      const existing = await repository().findOne({ where: { id: +req.params.id } as never });
      if (!existing) throw new HttpError(404, notFoundMessage);
      await repository().delete(+req.params.id);
      res.status(204).send();
    }),
  );

  return router;
}
