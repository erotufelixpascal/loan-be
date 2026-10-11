import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type RepaymentScheduleStatus = 'pending' | 'paid' | 'overdue';

@Entity()
export class RepaymentSchedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  loanId!: number; // -> Loan.id

  @Column({ type: 'int' })
  installmentNumber!: number;

  @Column({ type: 'date' })
  dueDate!: string;

  @Column({ type: 'float' })
  principalDue!: number;

  @Column({ type: 'float' })
  interestDue!: number;

  @Column({ type: 'float' })
  totalDue!: number;

  @Column({ type: 'varchar', default: 'pending' })
  status!: RepaymentScheduleStatus;
}
