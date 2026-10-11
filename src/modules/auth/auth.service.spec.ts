import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { HttpError } from '../../middleware/error-handler';
import { User } from '../../entities/user.entity';

type UserRepositoryMock = {
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  delete: jest.Mock;
};

function createRepositoryMock(): UserRepositoryMock {
  return {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
}

function asRepository(mock: UserRepositoryMock): Repository<User> {
  return mock as unknown as Repository<User>;
}

describe('AuthService', () => {
  const registerDto = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '555-0100',
    password: 'supersecret',
  };

  it('register rejects a duplicate email', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue({ id: 1, email: registerDto.email });
    const service = new AuthService(asRepository(repository));

    await expect(service.register(registerDto)).rejects.toThrow(HttpError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('register hashes the password and returns a token', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue(null);
    let savedUser: Partial<User> | undefined;
    repository.save.mockImplementation((user: Partial<User>) => {
      savedUser = user;
      return Promise.resolve({ id: 1, ...user } as User);
    });
    const service = new AuthService(asRepository(repository));

    const result = await service.register(registerDto);

    expect(savedUser?.password).not.toBe(registerDto.password);
    expect(
      await bcrypt.compare(registerDto.password, savedUser?.password ?? ''),
    ).toBe(true);
    expect(savedUser?.role).toBe('client');
    expect(result.user).not.toHaveProperty('password');
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);
  });

  it('login rejects a wrong password', async () => {
    const repository = createRepositoryMock();
    const hashed = await bcrypt.hash('correct-password', 10);
    repository.findOne.mockResolvedValue({
      id: 1,
      email: 'ada@example.com',
      password: hashed,
      role: 'client',
    });
    const service = new AuthService(asRepository(repository));

    await expect(
      service.login({ email: 'ada@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(HttpError);
  });

  it('login succeeds and returns a token', async () => {
    const repository = createRepositoryMock();
    const hashed = await bcrypt.hash('correct-password', 10);
    const user = {
      id: 1,
      email: 'ada@example.com',
      password: hashed,
      role: 'client' as const,
      lastLoginAt: null as Date | null,
    };
    repository.findOne.mockResolvedValue(user);
    let savedUser: Partial<User> | undefined;
    repository.save.mockImplementation((u: Partial<User>) => {
      savedUser = u;
      return Promise.resolve(u as User);
    });
    const service = new AuthService(asRepository(repository));

    const result = await service.login({
      email: 'ada@example.com',
      password: 'correct-password',
    });

    expect(savedUser?.lastLoginAt).toBeInstanceOf(Date);
    expect(result.user).not.toHaveProperty('password');
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);
  });
});
