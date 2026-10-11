import { In, Repository } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { HttpError } from '../../middleware/error-handler';
import { Loan, LoanStatus } from '../../entities/loan.entity';
import { LoanApplication } from '../../entities/loan-application.entity';
import { RepaymentSchedule } from '../../entities/repayment-schedule.entity';
import { AuthenticatedUser } from '../loan-applications/loan-application.service';

export class LoanService {
  constructor(
    private readonly loanRepository: Repository<Loan> = AppDataSource.getRepository(
      Loan,
    ),
    private readonly applicationRepository: Repository<LoanApplication> = AppDataSource.getRepository(
      LoanApplication,
    ),
    private readonly scheduleRepository: Repository<RepaymentSchedule> = AppDataSource.getRepository(
      RepaymentSchedule,
    ),
  ) {}

  private async applicationIdsForCustomer(
    customerId: number,
  ): Promise<number[]> {
    const applications = await this.applicationRepository.find({
      where: { customerId },
    });
    return applications.map((application) => application.id);
  }

  async findAllForUser(
    user: AuthenticatedUser,
    status?: LoanStatus,
  ): Promise<Loan[]> {
    if (user.role === 'client') {
      const applicationIds = await this.applicationIdsForCustomer(user.id);
      if (applicationIds.length === 0) {
        return [];
      }
      return this.loanRepository.find({
        where: {
          applicationId: In(applicationIds),
          ...(status ? { status } : {}),
        },
      });
    }
    return this.loanRepository.find({ where: status ? { status } : {} });
  }

  private async assertOwnership(
    loan: Loan,
    user: AuthenticatedUser,
  ): Promise<void> {
    if (user.role === 'client') {
      const application = await this.applicationRepository.findOne({
        where: { id: loan.applicationId },
      });
      if (!application || application.customerId !== user.id) {
        throw new HttpError(
          403,
          'You do not have permission to view this loan',
        );
      }
    }
  }

  async findOne(id: number, user: AuthenticatedUser): Promise<Loan> {
    const loan = await this.loanRepository.findOne({ where: { id } });
    if (!loan) {
      throw new HttpError(404, 'Loan not found');
    }
    await this.assertOwnership(loan, user);
    return loan;
  }

  async getSchedule(
    loanId: number,
    user: AuthenticatedUser,
  ): Promise<RepaymentSchedule[]> {
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });
    if (!loan) {
      throw new HttpError(404, 'Loan not found');
    }
    await this.assertOwnership(loan, user);
    return this.scheduleRepository.find({
      where: { loanId },
      order: { installmentNumber: 'ASC' },
    });
  }
}
