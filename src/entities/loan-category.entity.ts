import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class LoanCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'float' })
  interestRateMin!: number;

  @Column({ type: 'float' })
  interestRateMax!: number;

  @Column({ type: 'int' })
  termMinMonths!: number;

  @Column({ type: 'int' })
  termMaxMonths!: number;

  @Column({ type: 'boolean', default: false })
  collateralRequired!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
