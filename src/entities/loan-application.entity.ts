import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type LoanApplicationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'disbursed';

@Entity()
export class LoanApplication {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  customerId!: number; // -> User.id

  @Column({ type: 'int' })
  categoryId!: number; // -> LoanCategory.id

  @Column({ type: 'float' })
  amount!: number;

  @Column({ type: 'int' })
  term!: number; // months

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'varchar', default: 'pending' })
  status!: LoanApplicationStatus;

  @CreateDateColumn()
  appliedAt!: Date;

  @Column({ type: 'int', nullable: true })
  decidedBy!: number | null; // -> User.id (staff/manager)

  @Column({ type: 'timestamp', nullable: true })
  decisionAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  decisionComment!: string | null;
}
