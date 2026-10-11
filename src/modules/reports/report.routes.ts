import { Router } from 'express';
import { ReportService } from './report.service';
import { asyncHandler } from '../../middleware/async-handler';
import { requireAuth, requireRole } from '../../middleware/auth';

export const reportRouter = Router();
const reportService = new ReportService();

// Every report route is at least staff/manager; audit-log tightens further below.
reportRouter.use(requireAuth, requireRole('staff', 'manager'));

/**
 * @openapi
 * /reports/statistics:
 *   get:
 *     summary: Get pre-aggregated loan/application counts and sums for dashboards
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: OK
 *       403:
 *         description: Forbidden
 */
reportRouter.get(
  '/statistics',
  asyncHandler(async (req, res) => {
    res.json(await reportService.getStatistics());
  }),
);

/**
 * @openapi
 * /reports/loan-terms:
 *   get:
 *     summary: Get the distinct loan term ranges configured across loan categories
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: OK
 *       403:
 *         description: Forbidden
 */
reportRouter.get(
  '/loan-terms',
  asyncHandler(async (req, res) => {
    res.json(await reportService.getLoanTerms());
  }),
);

/**
 * @openapi
 * /reports/audit-log:
 *   get:
 *     summary: Get the most recent 100 audit log entries (manager only)
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: OK
 *       403:
 *         description: Forbidden
 */
reportRouter.get(
  '/audit-log',
  requireRole('manager'),
  asyncHandler(async (req, res) => {
    res.json(await reportService.getRecentAuditLog());
  }),
);
