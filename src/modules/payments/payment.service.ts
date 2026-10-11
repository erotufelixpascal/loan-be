import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { HttpError } from '../../middleware/error-handler';
import { recordAudit } from '../../lib/audit';
import { Payment } from '../../entities/payment.entity';
import { Loan } from '../../entities/loan.entity';
import { RepaymentSchedule } from '../../entities/repayment-schedule.entity';
import { CreatePaymentInput } from './payment.schema';

export class PaymentService {
  constructor(
    private readonly paymentRepository: Repository<Payment> = AppDataSource.getRepository(
      Payment,
    ),
    private readonly loanRepository: Repository<Loan> = AppDataSource.getRepository(
      Loan,
    ),
    private readonly scheduleRepository: Repository<RepaymentSchedule> = AppDataSource.getRepository(
      RepaymentSchedule,
    ),
  ) {}

  async create(
    receivedBy: number,
    input: CreatePaymentInput,
  ): Promise<Payment> {
    const loan = await this.loanRepository.findOne({
      where: { id: input.loanId },
    });
    if (!loan) {
      throw new HttpError(404, 'Loan not found');
    }

    const payment = await this.paymentRepository.save({
      loanId: input.loanId,
      scheduleId: input.scheduleId ?? null,
      amountPaid: input.amountPaid,
      method: input.method,
      receivedBy,
    });

    loan.outstandingBalance = Math.max(
      0,
      loan.outstandingBalance - input.amountPaid,
    );
    if (loan.outstandingBalance === 0) {
      loan.status = 'closed';
    }
    await this.loanRepository.save(loan);

    if (input.scheduleId) {
      const schedule = await this.scheduleRepository.findOne({
        where: { id: input.scheduleId },
      });
      if (schedule) {
        schedule.status = 'paid';
        await this.scheduleRepository.save(schedule);
      }
    }

    await recordAudit({
      actorId: receivedBy,
      action: 'payment.recorded',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: {
        loanId: loan.id,
        amountPaid: input.amountPaid,
        outstandingBalance: loan.outstandingBalance,
      },
    });

    return payment;
  }
}
