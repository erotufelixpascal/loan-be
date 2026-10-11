import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { env } from './env';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { LoanCategory } from '../entities/loan-category.entity';
import { LoanApplication } from '../entities/loan-application.entity';
import { Loan } from '../entities/loan.entity';
import { RepaymentSchedule } from '../entities/repayment-schedule.entity';
import { Payment } from '../entities/payment.entity';
import { Collateral } from '../entities/collateral.entity';
import { Payroll } from '../entities/payroll.entity';
import { AuditLog } from '../entities/audit-log.entity';

const entities = [
  User,
  Role,
  LoanCategory,
  LoanApplication,
  Loan,
  RepaymentSchedule,
  Payment,
  Collateral,
  Payroll,
  AuditLog,
];

// DB_TYPE switches the dialect; host/port/credentials come from the
// matching block in .env (DB_* for postgres, DATABASE_* for mssql).
const connectionOptions: DataSourceOptions =
  env.db.type === 'mssql'
    ? {
        ...env.db,
        entities,
        synchronize: true,
        logging: true,
        options: { encrypt: false, trustServerCertificate: true },
      }
    : {
        ...env.db,
        entities,
        synchronize: true,
        logging: true,
      };

export const AppDataSource = new DataSource(connectionOptions);
