import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { AppDataSource } from '../../config/data-source';
import { HttpError } from '../../middleware/error-handler';
import { hashPassword, comparePassword } from '../../lib/password';
import { signAuthToken } from '../../lib/jwt';
import { LoginInput, RegisterInput } from './auth.schema';

export type SafeUser = Omit<User, 'password'>;

export interface AuthResult {
  user: SafeUser;
  token: string;
}

export class AuthService {
  constructor(
    private readonly userRepository: Repository<User> = AppDataSource.getRepository(
      User,
    ),
  ) {}

  async register(registerDto: RegisterInput): Promise<AuthResult> {
    const existing = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new HttpError(409, 'Email already registered');
    }

    const user = await this.userRepository.save({
      ...registerDto,
      password: await hashPassword(registerDto.password),
      role: 'client',
      branch: null,
      status: 'active',
      lastLoginAt: null,
    });

    return {
      user: this.sanitize(user),
      token: signAuthToken({ id: user.id, email: user.email, role: user.role }),
    };
  }

  async login(loginDto: LoginInput): Promise<AuthResult> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });
    if (!user || !(await comparePassword(loginDto.password, user.password))) {
      throw new HttpError(401, 'Invalid email or password');
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return {
      user: this.sanitize(user),
      token: signAuthToken({ id: user.id, email: user.email, role: user.role }),
    };
  }

  private sanitize(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
