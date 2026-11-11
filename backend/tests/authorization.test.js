import { describe, it, expect } from 'vitest';
import { api, makeUser } from './helpers.js';
import { ROLES } from '../src/utils/constants.js';

describe('Role-based authorization', () => {
  it('forbids a student from creating a notice', async () => {
    const { bearer } = await makeUser(ROLES.STUDENT);
    const res = await api()
      .post('/api/notices')
      .set('Authorization', bearer)
      .send({ title: 'Hi', description: 'Test' });
    expect(res.status).toBe(403);
  });

  it('allows faculty to create a notice', async () => {
    const { bearer } = await makeUser(ROLES.FACULTY);
    const res = await api()
      .post('/api/notices')
      .set('Authorization', bearer)
      .send({ title: 'Exam update', description: 'Mid-sems next week' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Exam update');
  });

  it('forbids a non-admin from listing all users', async () => {
    const { bearer } = await makeUser(ROLES.FACULTY);
    const res = await api().get('/api/admin/users').set('Authorization', bearer);
    expect(res.status).toBe(403);
  });

  it('allows an admin to read platform stats', async () => {
    const { bearer } = await makeUser(ROLES.ADMIN);
    const res = await api().get('/api/admin/stats').set('Authorization', bearer);
    expect(res.status).toBe(200);
    expect(res.body.data.counts).toBeDefined();
  });
});
