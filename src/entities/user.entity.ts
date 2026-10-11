import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type UserRole = 'client' | 'staff' | 'manager';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  firstName!: string;

  @Column({ type: 'varchar' })
  lastName!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  phone!: string;

  @Column({ type: 'varchar' })
  password!: string; // bcrypt hash

  @Column({ type: 'varchar' })
  role!: UserRole;

  @Column({ type: 'varchar', nullable: true })
  branch!: string | null;

  @Column({ type: 'varchar', default: 'active' })
  status!: 'active' | 'suspended';

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt!: Date | null;
}
