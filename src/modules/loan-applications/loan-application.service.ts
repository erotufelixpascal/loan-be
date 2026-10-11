import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { HttpError } from '../../middleware/error-handler';
import { recordAudit } from '../../lib/audit';
import { LoanApplication } from '../../entities/loan-application.entity';
import { LoanCategory } from '../../entities/loan-category.entity';
import { Loan } from '../../entities/loan.entity';
import { RepaymentSchedule } from '../../entities/repayment-schedule.entity';
import { UserRole } from '../../entities/user.entity';
import {
  CreateLoanApplicationInput,
  DecisionInput,
} from './loan-application.schema';

export interface AuthenticatedUser {
  id: number;
  role: UserRole;
}

/**
 * Builds the equal-principal repayment schedule for a freshly disbursed loan.
 *
 * Simplification: interest is charged flat each month on the ORIGINAL
 * principal (interestRate% / 12), rather than on a declining balance. This
 * keeps the math simple for this pass; a true amortization schedule can
 * replace this later without changing the public shape of RepaymentSchedule.
 */
export function generateRepaymentSchedule(params: {
  loanId: number;
  principal: number;
  interestRate: number;
  term: number;
  disbursedAt: Date;
}): Partial<RepaymentSchedule>[] {
  const { loanId, principal, interestRate, term, disbursedAt } = params;
  const flatMonthlyInterest =
    Math.round(((principal * interestRate) / 100 / 12) * 100) / 100;
  const baseInstallmentPrincipal = Math.round((principal / term) * 100) / 100;

  const schedule: Partial<RepaymentSchedule>[] = [];
  let principalAllocated = 0;

  for (let i = 1; i <= term; i += 1) {
    const isLast = i === term;
    const principalDue = isLast
      ? Math.round((principal - principalAllocated) * 100) / 100
      : baseInstallmentPrincipal;
    principalAllocated += principalDue;

    const dueDateObj = new Date(
      disbursedAt.getFullYear(),
      disbursedAt.getMonth() + i,
      1,
    );
    const dueDate = `${dueDateObj.getFullYear()}-${String(dueDateObj.getMonth() + 1).padStart(2, '0')}-${String(
      dueDateObj.getDate(),
    ).padStart(2, '0')}`;

    schedule.push({
      loanId,
      installmentNumber: i,
      dueDate,
      principalDue,
      interestDue: flatMonthlyInterest,
      totalDue: Math.round((principalDue + flatMonthlyInterest) * 100) / 100,
      status: 'pending',
    });
  }

  return schedule;
}

export class LoanApplicationService {
  constructor(
    private readonly applicationRepository: Repository<LoanApplication> = AppDataSource.getRepository(
      LoanApplication,
    ),
    private readonly categoryRepository: Repository<LoanCategory> = AppDataSource.getRepository(
      LoanCategory,
    ),
    private readonly loanRepository: Repository<Loan> = AppDataSource.getRepository(
      Loan,
    ),
    private readonly scheduleRepository: Repository<RepaymentSchedule> = AppDataSource.getRepository(
      RepaymentSchedule,
    ),
  ) {}

  async create(
    customerId: number,
    input: CreateLoanApplicationInput,
  ): Promise<LoanApplication> {
    return this.applicationRepository.save({
      ...input,
      customerId,
      status: 'pending',
      decidedBy: null,
      decisionAt: null,
      decisionComment: null,
    });
  }

  async findAllForUser(user: AuthenticatedUser): Promise<LoanApplication[]> {
    if (user.role === 'client') {
      return this.applicationRepository.find({
        where: { customerId: user.id },
      });
    }
    return this.applicationRepository.find();
  }

  async findOne(id: number): Promise<LoanApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });
    if (!application) {
      throw new HttpError(404, 'Loan application not found');
    }
    return application;
  }

  async decide(
    id: number,
    decidedBy: number,
    input: DecisionInput,
  ): Promise<LoanApplication> {
    const application = await this.findOne(id);
    if (application.status !== 'pending') {
      throw new HttpError(
        409,
        `Application has already been decided (status: ${application.status})`,
      );
    }

    application.decidedBy = decidedBy;
    application.decisionAt = new Date();
    application.decisionComment = input.comment ?? null;

    if (input.status === 'rejected') {
      application.status = 'rejected';
      const saved = await this.applicationRepository.save(application);
      await recordAudit({
        actorId: decidedBy,
        action: 'loan_application.rejected',
        entityType: 'LoanApplication',
        entityId: saved.id,
        metadata: { comment: input.comment ?? null },
      });
      return saved;
    }

    // Approved applications are disbursed immediately: 'approved' is never
    // persisted as a resting status in this pass, the application jumps
    // straight from 'pending' to 'disbursed' once the loan + schedule exist.
    const category = await this.categoryRepository.findOne({
      where: { id: application.categoryId },
    });
    if (!category) {
      throw new HttpError(404, 'Loan category not found for this application');
    }
    const interestRate =
      (category.interestRateMin + category.interestRateMax) / 2;

    const loan = await this.loanRepository.save({
      applicationId: application.id,
      principal: application.amount,
      interestRate,
      term: application.term,
      outstandingBalance: application.amount,
      status: 'active',
    });

    const schedule = generateRepaymentSchedule({
      loanId: loan.id,
      principal: loan.principal,
      interestRate: loan.interestRate,
      term: loan.term,
      disbursedAt: loan.disbursedAt,
    });
    await this.scheduleRepository.save(schedule);

    application.status = 'disbursed';
    const saved = await this.applicationRepository.save(application);

    await recordAudit({
      actorId: decidedBy,
      action: 'loan_application.approved',
      entityType: 'LoanApplication',
      entityId: saved.id,
      metadata: { comment: input.comment ?? null },
    });
    await recordAudit({
      actorId: decidedBy,
      action: 'loan.disbursed',
      entityType: 'Loan',
      entityId: loan.id,
      metadata: {
        applicationId: application.id,
        principal: loan.principal,
        interestRate: loan.interestRate,
      },
    });

    return saved;
  }
}
