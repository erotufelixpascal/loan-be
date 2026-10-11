import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type LoanStatus = 'active' | 'closed' | 'defaulted';

@Entity()
export class Loan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', unique: true })
  applicationId!: number; // -> LoanApplication.id

  @Column({ type: 'float' })
  principal!: number;

  @Column({ type: 'float' })
  interestRate!: number;

  @Column({ type: 'int' })
  term!: number; // months

  @CreateDateColumn()
  disbursedAt!: Date;

  @Column({ type: 'float' })
  outstandingBalance!: number;

  @Column({ type: 'varchar', default: 'active' })
  status!: LoanStatus;
}
