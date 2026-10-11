import { Repository } from 'typeorm';
import { Payroll, PayrollStatus } from '../../entities/payroll.entity';
import { AppDataSource } from '../../config/data-source';
import { HttpError } from '../../middleware/error-handler';
import { CreatePayrollInput } from './payroll.schema';

export class PayrollService {
  constructor(
    private readonly payrollRepository: Repository<Payroll> = AppDataSource.getRepository(
      Payroll,
    ),
  ) {}

  async create(createPayrollDto: CreatePayrollInput): Promise<Payroll> {
    const netPay =
      createPayrollDto.baseSalary +
      createPayrollDto.commission -
      createPayrollDto.deductions;
    return this.payrollRepository.save({
      ...createPayrollDto,
      netPay,
      status: 'pending',
    });
  }

  async findAll(): Promise<Payroll[]> {
    return this.payrollRepository.find();
  }

  async findOne(id: number): Promise<Payroll> {
    const payroll = await this.payrollRepository.findOne({ where: { id } });
    if (!payroll) {
      throw new HttpError(404, 'Payroll record not found');
    }
    return payroll;
  }

  // The only thing editable post-creation in this pass is the status
  // (marking a pending record as paid) — amounts are immutable once created.
  async markStatus(id: number, status: PayrollStatus): Promise<Payroll> {
    const payroll = await this.findOne(id);
    return this.payrollRepository.save({ ...payroll, status });
  }
}
