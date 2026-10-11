import request from 'supertest';
import { app } from '../src/app';

describe('App (e2e)', () => {
  it('/ (GET)', () => {
    return request(app).get('/').expect(200).expect('Hello World!');
  });

  it('unknown route (GET) returns 404', () => {
    return request(app).get('/does-not-exist').expect(404);
  });
});
