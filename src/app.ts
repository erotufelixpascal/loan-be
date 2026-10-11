import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { appRouter } from './modules/app/app.routes';
import { managerRouter } from './modules/manager/manager.routes';
import { roleRouter } from './modules/role/role.routes';
import { notFoundHandler } from './middleware/not-found';
import { errorHandler } from './middleware/error-handler';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/', appRouter);
app.use('/manager', managerRouter);
app.use('/role', roleRouter);

app.use(notFoundHandler);
app.use(errorHandler);
