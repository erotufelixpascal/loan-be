import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

type DbType = 'postgres' | 'mssql';

function loadDbConfig() {
  const type: DbType = process.env.DB_TYPE === 'mssql' ? 'mssql' : 'postgres';

  if (type === 'mssql') {
    return {
      type: 'mssql' as const,
      host: required('DATABASE_HOST'),
      port: Number(required('DATABASE_PORT')),
      username: required('DATABASE_USER'),
      password: required('DATABASE_PASSWORD'),
      database: required('DATABASE_NAME'),
    };
  }

  return {
    type: 'postgres' as const,
    host: required('DB_HOST'),
    port: Number(required('DB_PORT')),
    username: required('DB_USERNAME'),
    password: required('DB_PASSWORD'),
    database: required('DB_DATABASE'),
  };
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  db: loadDbConfig(),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  },
};
