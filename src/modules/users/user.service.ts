import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { AppDataSource } from '../../config/data-source';
import { HttpError } from '../../middleware/error-handler';
import { hashPassword } from '../../lib/password';
import { CreateUserInput, UpdateUserInput } from './user.schema';

export type SafeUser = Omit<User, 'password'>;

export class UserService {
  constructor(
    private readonly userRepository: Repository<User> = AppDataSource.getRepository(
      User,
    ),
  ) {}

  async create(createUserDto: CreateUserInput): Promise<SafeUser> {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new HttpError(409, 'Email already registered');
    }

    const user = await this.userRepository.save({
      ...createUserDto,
      password: await hashPassword(createUserDto.password),
      branch: createUserDto.branch ?? null,
      status: 'active',
      lastLoginAt: null,
    });

    return this.sanitize(user);
  }

  async findAll(role?: UserRole): Promise<SafeUser[]> {
    const users = await this.userRepository.find(
      role ? { where: { role } } : {},
    );
    return users.map((user) => this.sanitize(user));
  }

  async findOne(id: number): Promise<SafeUser> {
    const user = await this.findOneEntity(id);
    return this.sanitize(user);
  }

  async update(id: number, updateUserDto: UpdateUserInput): Promise<SafeUser> {
    const user = await this.findOneEntity(id);
    const saved = await this.userRepository.save({ ...user, ...updateUserDto });
    return this.sanitize(saved);
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  private async findOneEntity(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    return user;
  }

  private sanitize(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
