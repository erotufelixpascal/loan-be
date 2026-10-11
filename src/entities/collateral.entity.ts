import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Collateral {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  applicationId!: number; // -> LoanApplication.id

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'float' })
  estimatedValue!: number;

  @Column({ type: 'varchar', nullable: true })
  documentUrl!: string | null;
}
