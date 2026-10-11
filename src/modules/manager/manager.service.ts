export class ManagerService {
  create() {
    return 'This action adds a new manager';
  }

  findAll() {
    return 'This action returns all manager';
  }

  findOne(id: number) {
    return `This action returns a #${id} manager`;
  }

  update(id: number) {
    return `This action updates a #${id} manager`;
  }

  remove(id: number) {
    return `This action removes a #${id} manager`;
  }
}
