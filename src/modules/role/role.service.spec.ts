import { Repository } from 'typeorm';
import { RoleService } from './role.service';
import { HttpError } from '../../middleware/error-handler';
import { Role } from '../../entities/role.entity';

type RoleRepositoryMock = {
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  delete: jest.Mock;
};

function createRepositoryMock(): RoleRepositoryMock {
  return {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
}

function asRepository(mock: RoleRepositoryMock): Repository<Role> {
  return mock as unknown as Repository<Role>;
}

describe('RoleService', () => {
  it('create saves the given role', async () => {
    const repository = createRepositoryMock();
    const dto = { name: 'admin', description: 'Admin role' };
    repository.save.mockResolvedValue({ id: 1, ...dto, permissions: [] });
    const service = new RoleService(asRepository(repository));

    const result = await service.create(dto);

    expect(repository.save).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, ...dto, permissions: [] });
  });

  it('findOne throws HttpError(404) when the role does not exist', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue(null);
    const service = new RoleService(asRepository(repository));

    await expect(service.findOne(99)).rejects.toThrow(HttpError);
  });

  it('findOne returns the role when found', async () => {
    const repository = createRepositoryMock();
    const role: Role = {
      id: 1,
      name: 'admin',
      description: 'Admin role',
      permissions: [],
    };
    repository.findOne.mockResolvedValue(role);
    const service = new RoleService(asRepository(repository));

    await expect(service.findOne(1)).resolves.toEqual(role);
  });
});
