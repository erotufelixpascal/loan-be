import { Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { AppDataSource } from '../../config/data-source';
import { HttpError } from '../../middleware/error-handler';
import { CreateRoleInput, UpdateRoleInput } from './role.schema';

export class RoleService {
  constructor(
    private readonly roleRepository: Repository<Role> = AppDataSource.getRepository(
      Role,
    ),
  ) {}

  async create(createRoleDto: CreateRoleInput): Promise<Role> {
    return this.roleRepository.save(createRoleDto);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new HttpError(404, 'Role not found');
    }
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleInput): Promise<Role> {
    const role = await this.findOne(id);
    return this.roleRepository.save({ ...role, ...updateRoleDto });
  }

  async remove(id: number): Promise<void> {
    await this.roleRepository.delete(id);
  }
}
