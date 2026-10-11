import { Repository } from 'typeorm';
import { PayrollService } from './payroll.service';
import { HttpError } from '../../middleware/error-handler';
import { Payroll } from '../../entities/payroll.entity';

type PayrollRepositoryMock = {
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
};

function createRepositoryMock(): PayrollRepositoryMock {
  return {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
}

function asRepository(mock: PayrollRepositoryMock): Repository<Payroll> {
  return mock as unknown as Repository<Payroll>;
}

describe('PayrollService', () => {
  it('create computes netPay from baseSalary + commission - deductions and defaults status to pending', async () => {
    const repository = createRepositoryMock();
    const dto = {
      staffId: 1,
      period: '2026-10',
      baseSalary: 1000,
      commission: 200,
      deductions: 50,
    };
    repository.save.mockImplementation((value: Partial<Payroll>) =>
      Promise.resolve({ id: 1, ...value }),
    );
    const service = new PayrollService(asRepository(repository));

    const result = await service.create(dto);

    expect(repository.save).toHaveBeenCalledWith({
      ...dto,
      netPay: 1150,
      status: 'pending',
    });
    expect(result.netPay).toBe(1150);
    expect(result.status).toBe('pending');
  });

  it('findOne throws HttpError(404) when the payroll record does not exist', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue(null);
    const service = new PayrollService(asRepository(repository));

    await expect(service.findOne(99)).rejects.toThrow(HttpError);
  });

  it('findOne returns the payroll record when found', async () => {
    const repository = createRepositoryMock();
    const payroll: Payroll = {
      id: 1,
      staffId: 1,
      period: '2026-10',
      baseSalary: 1000,
      commission: 200,
      deductions: 50,
      netPay: 1150,
      status: 'pending',
    };
    repository.findOne.mockResolvedValue(payroll);
    const service = new PayrollService(asRepository(repository));

    await expect(service.findOne(1)).resolves.toEqual(payroll);
  });

  it('markStatus transitions a pending record to paid without touching the amounts', async () => {
    const repository = createRepositoryMock();
    const existing: Payroll = {
      id: 1,
      staffId: 1,
      period: '2026-10',
      baseSalary: 1000,
      commission: 200,
      deductions: 50,
      netPay: 1150,
      status: 'pending',
    };
    repository.findOne.mockResolvedValue(existing);
    repository.save.mockImplementation((value: Partial<Payroll>) =>
      Promise.resolve(value),
    );
    const service = new PayrollService(asRepository(repository));

    const result = await service.markStatus(1, 'paid');

    expect(repository.save).toHaveBeenCalledWith({
      ...existing,
      status: 'paid',
    });
    expect(result.status).toBe('paid');
    expect(result.netPay).toBe(1150);
  });

  it('markStatus throws HttpError(404) when the payroll record does not exist', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue(null);
    const service = new PayrollService(asRepository(repository));

    await expect(service.markStatus(99, 'paid')).rejects.toThrow(HttpError);
  });
});
