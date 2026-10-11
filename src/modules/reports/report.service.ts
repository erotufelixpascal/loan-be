import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { LoanApplication } from '../../entities/loan-application.entity';
import { Loan } from '../../entities/loan.entity';
import { Payment } from '../../entities/payment.entity';
import { LoanCategory } from '../../entities/loan-category.entity';
import { AuditLog } from '../../entities/audit-log.entity';

export interface Statistics {
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  disbursedApplications: number;
  activeLoans: number;
  closedLoans: number;
  defaultedLoans: number;
  totalPrincipalDisbursed: number;
  totalOutstanding: number;
  totalCollected: number;
}

export interface LoanTermRange {
  termMinMonths: number;
  termMaxMonths: number;
}

// Coalesces a SUM(...) raw aggregate (which comes back as a numeric string,
// or null/undefined when the table has no rows) into a plain number.
function toNumber(value: string | number | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class ReportService {
  constructor(
    private readonly loanApplicationRepository: Repository<LoanApplication> = AppDataSource.getRepository(
      LoanApplication,
    ),
    private readonly loanRepository: Repository<Loan> = AppDataSource.getRepository(
      Loan,
    ),
    private readonly paymentRepository: Repository<Payment> = AppDataSource.getRepository(
      Payment,
    ),
    private readonly loanCategoryRepository: Repository<LoanCategory> = AppDataSource.getRepository(
      LoanCategory,
    ),
    private readonly auditLogRepository: Repository<AuditLog> = AppDataSource.getRepository(
      AuditLog,
    ),
  ) {}

  async getStatistics(): Promise<Statistics> {
    const [
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      disbursedApplications,
      activeLoans,
      closedLoans,
      defaultedLoans,
      principalRaw,
      outstandingRaw,
      collectedRaw,
    ] = await Promise.all([
      this.loanApplicationRepository.count({ where: { status: 'pending' } }),
      this.loanApplicationRepository.count({ where: { status: 'approved' } }),
      this.loanApplicationRepository.count({ where: { status: 'rejected' } }),
      this.loanApplicationRepository.count({ where: { status: 'disbursed' } }),
      this.loanRepository.count({ where: { status: 'active' } }),
      this.loanRepository.count({ where: { status: 'closed' } }),
      this.loanRepository.count({ where: { status: 'defaulted' } }),
      this.loanRepository
        .createQueryBuilder('loan')
        .select('SUM(loan.principal)', 'sum')
        .getRawOne<{ sum: string | null }>(),
      this.loanRepository
        .createQueryBuilder('loan')
        .select('SUM(loan.outstandingBalance)', 'sum')
        .getRawOne<{ sum: string | null }>(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amountPaid)', 'sum')
        .getRawOne<{ sum: string | null }>(),
    ]);

    return {
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      disbursedApplications,
      activeLoans,
      closedLoans,
      defaultedLoans,
      totalPrincipalDisbursed: toNumber(principalRaw?.sum),
      totalOutstanding: toNumber(outstandingRaw?.sum),
      totalCollected: toNumber(collectedRaw?.sum),
    };
  }

  // Derived reference data for the frontend's "loan terms" screen: the
  // distinct (termMinMonths, termMaxMonths) pairs currently configured on
  // loan categories. If no categories exist yet, an empty list is the
  // correct answer — not hardcoded placeholder data.
  async getLoanTerms(): Promise<LoanTermRange[]> {
    const categories = await this.loanCategoryRepository.find();
    const seen = new Set<string>();
    const terms: LoanTermRange[] = [];
    for (const category of categories) {
      const key = `${category.termMinMonths}-${category.termMaxMonths}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      terms.push({
        termMinMonths: category.termMinMonths,
        termMaxMonths: category.termMaxMonths,
      });
    }
    return terms;
  }

  async getRecentAuditLog(): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }
}
