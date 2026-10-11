import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import { env } from './config/env';
import { app } from './app';
import { seedDefaultManagerIfEmpty } from './lib/seed';

async function bootstrap() {
  await AppDataSource.initialize();
  await seedDefaultManagerIfEmpty();
  app.listen(env.port, () => {
    console.log(`Loan Management System API listening on port ${env.port}`);
    console.log(`Swagger docs available at /api/docs`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start the application', error);
  process.exit(1);
});
