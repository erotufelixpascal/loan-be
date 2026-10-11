import { Repository } from 'typeorm';
import { ReportService } from './report.service';
import { LoanApplication } from '../../entities/loan-application.entity';
import { Loan } from '../../entities/loan.entity';
import { Payment } from '../../entities/payment.entity';
import { LoanCategory } from '../../entities/loan-category.entity';
import { AuditLog } from '../../entities/audit-log.entity';

type CountRepositoryMock = {
  count: jest.Mock;
  createQueryBuilder?: jest.Mock;
};

type QueryBuilderOnlyRepositoryMock = {
  createQueryBuilder: jest.Mock;
};

function createQueryBuilderMock(rawOneResult: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(rawOneResult),
  };
}

function buildService(overrides: {
  loanApplicationRepository?: Partial<CountRepositoryMock>;
  loanRepository?: Partial<CountRepositoryMock>;
  paymentRepository?: Partial<QueryBuilderOnlyRepositoryMock>;
  loanCategoryRepository?: { find: jest.Mock };
  auditLogRepository?: { find: jest.Mock };
}) {
  return new ReportService(
    (overrides.loanApplicationRepository ??
      {}) as unknown as Repository<LoanApplication>,
    (overrides.loanRepository ?? {}) as unknown as Repository<Loan>,
    (overrides.paymentRepository ?? {}) as unknown as Repository<Payment>,
    (overrides.loanCategoryRepository ?? {
      find: jest.fn(),
    }) as unknown as Repository<LoanCategory>,
    (overrides.auditLogRepository ?? {
      find: jest.fn(),
    }) as unknown as Repository<AuditLog>,
  );
}

describe('ReportService', () => {
  describe('getStatistics', () => {
    it('shapes counts and sums from the underlying repositories', async () => {
      const loanApplicationRepository: CountRepositoryMock = {
        count: jest
          .fn()
          .mockResolvedValueOnce(2) // pending
          .mockResolvedValueOnce(3) // approved
          .mockResolvedValueOnce(1) // rejected
          .mockResolvedValueOnce(4), // disbursed
      };
      const loanRepository: CountRepositoryMock = {
        count: jest
          .fn()
          .mockResolvedValueOnce(5) // active
          .mockResolvedValueOnce(6) // closed
          .mockResolvedValueOnce(0), // defaulted
        createQueryBuilder: jest
          .fn()
          .mockReturnValueOnce(createQueryBuilderMock({ sum: '10000' })) // principal
          .mockReturnValueOnce(createQueryBuilderMock({ sum: '4000.5' })), // outstanding
      };
      const paymentRepository: QueryBuilderOnlyRepositoryMock = {
        createQueryBuilder: jest
          .fn()
          .mockReturnValue(createQueryBuilderMock({ sum: '2500.5' })),
      };

      const service = buildService({
        loanApplicationRepository,
        loanRepository,
        paymentRepository,
      });

      const result = await service.getStatistics();

      expect(result).toEqual({
        pendingApplications: 2,
        approvedApplications: 3,
        rejectedApplications: 1,
        disbursedApplications: 4,
        activeLoans: 5,
        closedLoans: 6,
        defaultedLoans: 0,
        totalPrincipalDisbursed: 10000,
        totalOutstanding: 4000.5,
        totalCollected: 2500.5,
      });
    });

    it('coalesces an empty database to zeros, never null/undefined/NaN', async () => {
      const loanApplicationRepository: CountRepositoryMock = {
        count: jest.fn().mockResolvedValue(0),
      };
      const loanRepository: CountRepositoryMock = {
        count: jest.fn().mockResolvedValue(0),
        createQueryBuilder: jest
          .fn()
          .mockReturnValue(createQueryBuilderMock({ sum: null })),
      };
      const paymentRepository: QueryBuilderOnlyRepositoryMock = {
        createQueryBuilder: jest
          .fn()
          .mockReturnValue(createQueryBuilderMock(undefined)),
      };

      const service = buildService({
        loanApplicationRepository,
        loanRepository,
        paymentRepository,
      });

      const result = await service.getStatistics();

      expect(result).toEqual({
        pendingApplications: 0,
        approvedApplications: 0,
        rejectedApplications: 0,
        disbursedApplications: 0,
        activeLoans: 0,
        closedLoans: 0,
        defaultedLoans: 0,
        totalPrincipalDisbursed: 0,
        totalOutstanding: 0,
        totalCollected: 0,
      });
      expect(Object.values(result).some((value) => Number.isNaN(value))).toBe(
        false,
      );
    });
  });

  describe('getLoanTerms', () => {
    it('returns [] when there are no loan categories', async () => {
      const service = buildService({
        loanCategoryRepository: { find: jest.fn().mockResolvedValue([]) },
      });

      await expect(service.getLoanTerms()).resolves.toEqual([]);
    });

    it('derives distinct (termMinMonths, termMaxMonths) pairs from loan categories', async () => {
      const loanCategoryRepository = {
        find: jest.fn().mockResolvedValue([
          { termMinMonths: 6, termMaxMonths: 12 },
          { termMinMonths: 6, termMaxMonths: 12 },
          { termMinMonths: 12, termMaxMonths: 24 },
        ]),
      };
      const service = buildService({ loanCategoryRepository });

      await expect(service.getLoanTerms()).resolves.toEqual([
        { termMinMonths: 6, termMaxMonths: 12 },
        { termMinMonths: 12, termMaxMonths: 24 },
      ]);
    });
  });

  describe('getRecentAuditLog', () => {
    it('fetches the most recent 100 entries ordered by timestamp descending', async () => {
      const auditLogRepository = { find: jest.fn().mockResolvedValue([]) };
      const service = buildService({ auditLogRepository });

      await service.getRecentAuditLog();

      expect(auditLogRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 100,
      });
    });
  });
});
