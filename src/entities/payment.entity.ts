import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  loanId!: number; // -> Loan.id

  @Column({ type: 'int', nullable: true })
  scheduleId!: number | null; // -> RepaymentSchedule.id

  @Column({ type: 'float' })
  amountPaid!: number;

  @CreateDateColumn()
  paidAt!: Date;

  @Column({ type: 'varchar' })
  method!: string;

  @Column({ type: 'int', nullable: true })
  receivedBy!: number | null; // -> User.id
}
