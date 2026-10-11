import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  actorId!: number | null; // -> User.id

  @Column({ type: 'varchar' })
  action!: string; // e.g. 'loan_application.approved'

  @Column({ type: 'varchar' })
  entityType!: string; // e.g. 'LoanApplication'

  @Column({ type: 'int', nullable: true })
  entityId!: number | null;

  @CreateDateColumn()
  timestamp!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;
}
