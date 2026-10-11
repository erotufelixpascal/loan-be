import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true })
  name!: string; // e.g., 'branch_manager', 'loan_officer'

  @Column({ type: 'varchar', nullable: true })
  description!: string; // e.g., 'Manages branch operations'

  @Column('text', { array: true, default: [] })
  permissions!: string[]; // e.g., ['create_loan', 'approve_loan']
}
