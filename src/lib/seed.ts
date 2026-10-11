import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { hashPassword } from './password';

const DEFAULT_MANAGER_EMAIL = 'manager@lms.local';
const DEFAULT_MANAGER_PASSWORD = 'Manager@2025';

/**
 * Self-registration only ever creates 'client' accounts (see AuthService),
 * so there's no way to create the first staff/manager account without one
 * already existing. On an empty users table, seed a single default manager
 * so there's someone who can create real staff/manager accounts via
 * POST /api/users.
 */
export async function seedDefaultManagerIfEmpty(): Promise<void> {
  const userRepository = AppDataSource.getRepository(User);
  const count = await userRepository.count();
  if (count > 0) {
    return;
  }

  await userRepository.save({
    firstName: 'Default',
    lastName: 'Manager',
    email: DEFAULT_MANAGER_EMAIL,
    phone: '+10000000000',
    password: await hashPassword(DEFAULT_MANAGER_PASSWORD),
    role: 'manager',
    branch: null,
    status: 'active',
    lastLoginAt: null,
  });

  console.log(
    `Seeded default manager account — email: ${DEFAULT_MANAGER_EMAIL}, password: ${DEFAULT_MANAGER_PASSWORD} (change this in production).`,
  );
}
