import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { appRouter } from './modules/app/app.routes';
import { managerRouter } from './modules/manager/manager.routes';
import { roleRouter } from './modules/role/role.routes';
import { authRouter } from './modules/auth/auth.routes';
import { userRouter } from './modules/users/user.routes';
import { payrollRouter } from './modules/payroll/payroll.routes';
import { reportRouter } from './modules/reports/report.routes';
import { loanCategoryRouter } from './modules/loan-categories/loan-category.routes';
import { loanApplicationRouter } from './modules/loan-applications/loan-application.routes';
import { loanRouter } from './modules/loans/loan.routes';
import { paymentRouter } from './modules/payments/payment.routes';
import { collateralRouter } from './modules/collateral/collateral.routes';
import { notFoundHandler } from './middleware/not-found';
import { errorHandler } from './middleware/error-handler';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/', appRouter);
app.use('/api/manager', managerRouter);
app.use('/api/role', roleRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/reports', reportRouter);
app.use('/api/loan-categories', loanCategoryRouter);
app.use('/api/loan-applications', loanApplicationRouter);
app.use('/api/loans', loanRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/collateral', collateralRouter);

app.use(notFoundHandler);
app.use(errorHandler);
