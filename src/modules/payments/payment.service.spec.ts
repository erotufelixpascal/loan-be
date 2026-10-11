import { Repository } from 'typeorm';
import { PaymentService } from './payment.service';
import { HttpError } from '../../middleware/error-handler';
import { Payment } from '../../entities/payment.entity';
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

function build() {
  const paymentRepository = createRepoMock();
  const loanRepository = createRepoMock();
  const scheduleRepository = createRepoMock();
  const service = new PaymentService(
    paymentRepository as unknown as Repository<Payment>,
    loanRepository as unknown as Repository<Loan>,
    scheduleRepository as unknown as Repository<RepaymentSchedule>,
  );
  return { service, paymentRepository, loanRepository, scheduleRepository };
}

describe('PaymentService', () => {
  it('throws HttpError(404) when the loan does not exist', async () => {
    const { service, loanRepository } = build();
    loanRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create(1, { loanId: 999, amountPaid: 100, method: 'cash' }),
    ).rejects.toThrow(HttpError);
  });

  it('decrements the outstanding balance and keeps the loan active when balance remains', async () => {
    const { service, loanRepository, paymentRepository } = build();
    const loan = { id: 1, outstandingBalance: 1000, status: 'active' };
    loanRepository.findOne.mockResolvedValue(loan);
    paymentRepository.save.mockResolvedValue({
      id: 1,
      loanId: 1,
      amountPaid: 300,
      method: 'cash',
    });
    loanRepository.save.mockImplementation((l) => Promise.resolve(l));

    await service.create(7, { loanId: 1, amountPaid: 300, method: 'cash' });

    expect(loanRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ outstandingBalance: 700, status: 'active' }),
    );
  });

  it('floors the balance at 0 and closes the loan when fully repaid', async () => {
    const { service, loanRepository, paymentRepository } = build();
    const loan = { id: 1, outstandingBalance: 200, status: 'active' };
    loanRepository.findOne.mockResolvedValue(loan);
    paymentRepository.save.mockResolvedValue({
      id: 1,
      loanId: 1,
      amountPaid: 500,
      method: 'cash',
    });
    loanRepository.save.mockImplementation((l) => Promise.resolve(l));

    await service.create(7, { loanId: 1, amountPaid: 500, method: 'cash' });

    expect(loanRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ outstandingBalance: 0, status: 'closed' }),
    );
  });

  it('marks the matching schedule row as paid when scheduleId is given', async () => {
    const { service, loanRepository, paymentRepository, scheduleRepository } =
      build();
    const loan = { id: 1, outstandingBalance: 1000, status: 'active' };
    loanRepository.findOne.mockResolvedValue(loan);
    loanRepository.save.mockImplementation((l) => Promise.resolve(l));
    paymentRepository.save.mockResolvedValue({
      id: 1,
      loanId: 1,
      scheduleId: 5,
      amountPaid: 100,
      method: 'cash',
    });
    const scheduleRow = { id: 5, status: 'pending' };
    scheduleRepository.findOne.mockResolvedValue(scheduleRow);
    scheduleRepository.save.mockImplementation((s) => Promise.resolve(s));

    await service.create(7, {
      loanId: 1,
      scheduleId: 5,
      amountPaid: 100,
      method: 'cash',
    });

    expect(scheduleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5, status: 'paid' }),
    );
  });

  it('does not touch the schedule repository when no scheduleId is given', async () => {
    const { service, loanRepository, paymentRepository, scheduleRepository } =
      build();
    const loan = { id: 1, outstandingBalance: 1000, status: 'active' };
    loanRepository.findOne.mockResolvedValue(loan);
    loanRepository.save.mockImplementation((l) => Promise.resolve(l));
    paymentRepository.save.mockResolvedValue({
      id: 1,
      loanId: 1,
      amountPaid: 100,
      method: 'cash',
    });

    await service.create(7, { loanId: 1, amountPaid: 100, method: 'cash' });

    expect(scheduleRepository.findOne).not.toHaveBeenCalled();
    expect(scheduleRepository.save).not.toHaveBeenCalled();
  });
});
