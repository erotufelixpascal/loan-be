import { Repository } from 'typeorm';
import {
  LoanApplicationService,
  generateRepaymentSchedule,
} from './loan-application.service';
import { HttpError } from '../../middleware/error-handler';
import { LoanApplication } from '../../entities/loan-application.entity';
import { LoanCategory } from '../../entities/loan-category.entity';
import { Loan } from '../../entities/loan.entity';
import { RepaymentSchedule } from '../../entities/repayment-schedule.entity';

jest.mock('../../lib/audit', () => ({
  recordAudit: jest.fn().mockResolvedValue(undefined),
}));

function createRepoMock() {
  return {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
}

describe('generateRepaymentSchedule', () => {
  it('produces `term` installments that sum exactly to the principal', () => {
    const schedule = generateRepaymentSchedule({
      loanId: 1,
      principal: 100,
      interestRate: 12,
      term: 3,
      disbursedAt: new Date(2026, 0, 15), // Jan 15 2026
    });

    expect(schedule).toHaveLength(3);
    const totalPrincipal = schedule.reduce(
      (sum, row) => sum + (row.principalDue ?? 0),
      0,
    );
    expect(Math.round(totalPrincipal * 100) / 100).toBe(100);
    expect(schedule.every((row) => row.status === 'pending')).toBe(true);
  });

  it('absorbs rounding remainder into the last installment', () => {
    const schedule = generateRepaymentSchedule({
      loanId: 1,
      principal: 100,
      interestRate: 0,
      term: 3,
      disbursedAt: new Date(2026, 0, 1),
    });

    expect(schedule[0].principalDue).toBe(33.33);
    expect(schedule[1].principalDue).toBe(33.33);
    expect(schedule[2].principalDue).toBe(33.34);
  });

  it('sets dueDate to the first of each month starting one month after disbursement', () => {
    const schedule = generateRepaymentSchedule({
      loanId: 1,
      principal: 1200,
      interestRate: 12,
      term: 2,
      disbursedAt: new Date(2026, 9, 11), // Oct 11 2026
    });

    expect(schedule[0].dueDate).toBe('2026-11-01');
    expect(schedule[1].dueDate).toBe('2026-12-01');
  });

  it('charges flat monthly interest on the original principal', () => {
    const schedule = generateRepaymentSchedule({
      loanId: 1,
      principal: 1200,
      interestRate: 12,
      term: 12,
      disbursedAt: new Date(2026, 0, 1),
    });

    // 1200 * 12% / 12 months = 12 per installment, flat.
    expect(schedule.every((row) => row.interestDue === 12)).toBe(true);
  });
});

describe('LoanApplicationService', () => {
  function build() {
    const applicationRepository = createRepoMock();
    const categoryRepository = createRepoMock();
    const loanRepository = createRepoMock();
    const scheduleRepository = createRepoMock();
    const service = new LoanApplicationService(
      applicationRepository as unknown as Repository<LoanApplication>,
      categoryRepository as unknown as Repository<LoanCategory>,
      loanRepository as unknown as Repository<Loan>,
      scheduleRepository as unknown as Repository<RepaymentSchedule>,
    );
    return {
      service,
      applicationRepository,
      categoryRepository,
      loanRepository,
      scheduleRepository,
    };
  }

  it('create saves a pending application owned by the given customer', async () => {
    const { service, applicationRepository } = build();
    applicationRepository.save.mockResolvedValue({ id: 1 });

    await service.create(42, {
      categoryId: 1,
      amount: 1000,
      term: 12,
      reason: 'school fees',
    });

    expect(applicationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 42,
        status: 'pending',
        decidedBy: null,
        decisionAt: null,
        decisionComment: null,
      }),
    );
  });

  it('decide throws HttpError(409) when the application is not pending', async () => {
    const { service, applicationRepository } = build();
    applicationRepository.findOne.mockResolvedValue({
      id: 1,
      status: 'disbursed',
    });

    await expect(service.decide(1, 7, { status: 'approved' })).rejects.toThrow(
      HttpError,
    );
  });

  it('decide(rejected) sets status to rejected without creating a loan', async () => {
    const { service, applicationRepository, loanRepository } = build();
    const application = {
      id: 1,
      status: 'pending',
      customerId: 5,
      categoryId: 2,
      amount: 500,
      term: 6,
    };
    applicationRepository.findOne.mockResolvedValue(application);
    applicationRepository.save.mockImplementation((a) => Promise.resolve(a));

    const result = await service.decide(1, 7, {
      status: 'rejected',
      comment: 'insufficient income',
    });

    expect(result.status).toBe('rejected');
    expect(loanRepository.save).not.toHaveBeenCalled();
  });

  it('decide(approved) disburses a loan, generates a schedule, and sets status to disbursed', async () => {
    const {
      service,
      applicationRepository,
      categoryRepository,
      loanRepository,
      scheduleRepository,
    } = build();
    const application = {
      id: 1,
      status: 'pending',
      customerId: 5,
      categoryId: 2,
      amount: 1200,
      term: 12,
    };
    applicationRepository.findOne.mockResolvedValue(application);
    applicationRepository.save.mockImplementation((a) => Promise.resolve(a));
    categoryRepository.findOne.mockResolvedValue({
      id: 2,
      interestRateMin: 10,
      interestRateMax: 14,
    });
    loanRepository.save.mockResolvedValue({
      id: 99,
      applicationId: 1,
      principal: 1200,
      interestRate: 12,
      term: 12,
      outstandingBalance: 1200,
      status: 'active',
      disbursedAt: new Date(2026, 0, 1),
    });
    let capturedSchedule: Partial<RepaymentSchedule>[] = [];
    scheduleRepository.save.mockImplementation(
      (rows: Partial<RepaymentSchedule>[]) => {
        capturedSchedule = rows;
        return Promise.resolve(rows);
      },
    );

    const result = await service.decide(1, 7, { status: 'approved' });

    expect(categoryRepository.findOne).toHaveBeenCalledWith({
      where: { id: 2 },
    });
    expect(loanRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: 1,
        principal: 1200,
        interestRate: 12,
        outstandingBalance: 1200,
      }),
    );
    expect(scheduleRepository.save).toHaveBeenCalled();
    expect(capturedSchedule).toHaveLength(12);
    expect(result.status).toBe('disbursed');
  });
});
