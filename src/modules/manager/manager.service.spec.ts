import { ManagerService } from './manager.service';

describe('ManagerService', () => {
  const service = new ManagerService();

  it('create returns a placeholder message', () => {
    expect(service.create()).toBe('This action adds a new manager');
  });

  it('findAll returns a placeholder message', () => {
    expect(service.findAll()).toBe('This action returns all manager');
  });

  it('findOne includes the id', () => {
    expect(service.findOne(5)).toBe('This action returns a #5 manager');
  });

  it('update includes the id', () => {
    expect(service.update(5)).toBe('This action updates a #5 manager');
  });

  it('remove includes the id', () => {
    expect(service.remove(5)).toBe('This action removes a #5 manager');
  });
});
