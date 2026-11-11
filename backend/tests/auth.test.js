import { describe, it, expect } from 'vitest';
import { api } from './helpers.js';

describe('Auth', () => {
  const student = { name: 'Test Student', email: 'newstudent@test.edu', password: 'Secret123' };

  it('registers a new student and returns tokens', async () => {
    const res = await api().post('/api/auth/register').send(student);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.role).toBe('student');
    expect(res.body.data.user.passwordHash).toBeUndefined(); // never leaked
  });

  it('rejects duplicate email', async () => {
    await api().post('/api/auth/register').send(student);
    const res = await api().post('/api/auth/register').send(student);
    expect(res.status).toBe(409);
  });

  it('rejects invalid email format (validation)', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'X', email: 'not-an-email', password: 'Secret123' });
    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });

  it('logs in with correct credentials and rejects wrong password', async () => {
    await api().post('/api/auth/register').send(student);

    const ok = await api().post('/api/auth/login').send({ email: student.email, password: student.password });
    expect(ok.status).toBe(200);
    expect(ok.body.data.accessToken).toBeTruthy();

    const bad = await api().post('/api/auth/login').send({ email: student.email, password: 'wrong' });
    expect(bad.status).toBe(401);
  });

  it('protects /api/auth/me and returns the user when authenticated', async () => {
    const reg = await api().post('/api/auth/register').send(student);
    const token = reg.body.data.accessToken;

    const noAuth = await api().get('/api/auth/me');
    expect(noAuth.status).toBe(401);

    const withAuth = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(withAuth.status).toBe(200);
    expect(withAuth.body.data.user.email).toBe(student.email);
  });
});
