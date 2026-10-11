import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type PayrollStatus = 'pending' | 'paid';

@Entity()
export class Payroll {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  staffId!: number; // -> User.id

  @Column({ type: 'varchar' })
  period!: string; // e.g. '2026-10'

  @Column({ type: 'float' })
  baseSalary!: number;

  @Column({ type: 'float', default: 0 })
  commission!: number;

  @Column({ type: 'float', default: 0 })
  deductions!: number;

  @Column({ type: 'float' })
  netPay!: number;

  @Column({ type: 'varchar', default: 'pending' })
  status!: PayrollStatus;
}
