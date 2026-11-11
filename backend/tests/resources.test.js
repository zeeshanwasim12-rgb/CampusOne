import { describe, it, expect } from 'vitest';
import { api, makeUser } from './helpers.js';
import { ROLES } from '../src/utils/constants.js';

const sampleFile = () => Buffer.from('CampusOne sample resource file content');

describe('Resources & file upload', () => {
  it('lets faculty upload a resource (auto-approved) with a real file', async () => {
    const { bearer } = await makeUser(ROLES.FACULTY);
    const res = await api()
      .post('/api/resources')
      .set('Authorization', bearer)
      .field('title', 'DBMS PYQ 2023')
      .field('type', 'pyq')
      .field('subject', 'DBMS')
      .field('semester', '4')
      .attach('file', sampleFile(), { filename: 'dbms.txt', contentType: 'text/plain' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.file.key).toBeTruthy();
  });

  it('puts a student upload into the pending (moderation) queue', async () => {
    const { bearer } = await makeUser(ROLES.STUDENT);
    const res = await api()
      .post('/api/resources')
      .set('Authorization', bearer)
      .field('title', 'My notes')
      .field('type', 'study_material')
      .field('subject', 'DBMS')
      .attach('file', sampleFile(), { filename: 'notes.txt', contentType: 'text/plain' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
  });

  it('rejects upload without a file (validation of required file)', async () => {
    const { bearer } = await makeUser(ROLES.FACULTY);
    const res = await api()
      .post('/api/resources')
      .set('Authorization', bearer)
      .field('title', 'No file')
      .field('type', 'pyq')
      .field('subject', 'DBMS');
    expect(res.status).toBe(400);
  });

  it('lists approved resources and returns a download URL', async () => {
    const { bearer } = await makeUser(ROLES.FACULTY);
    const created = await api()
      .post('/api/resources')
      .set('Authorization', bearer)
      .field('title', 'OS Lab Manual')
      .field('type', 'lab_manual')
      .field('subject', 'Operating Systems')
      .attach('file', sampleFile(), { filename: 'os.txt', contentType: 'text/plain' });
    const id = created.body.data._id;

    const list = await api().get('/api/resources?type=lab_manual');
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThan(0);

    const dl = await api().get(`/api/resources/${id}/download`).set('Authorization', bearer);
    expect(dl.status).toBe(200);
    expect(dl.body.data.url).toContain('/api/files/');
  });

  it('toggles a bookmark on and off', async () => {
    const faculty = await makeUser(ROLES.FACULTY);
    const created = await api()
      .post('/api/resources')
      .set('Authorization', faculty.bearer)
      .field('title', 'CN Notes')
      .field('type', 'study_material')
      .field('subject', 'Computer Networks')
      .attach('file', sampleFile(), { filename: 'cn.txt', contentType: 'text/plain' });
    const id = created.body.data._id;

    const student = await makeUser(ROLES.STUDENT);
    const on = await api().post(`/api/bookmarks/${id}`).set('Authorization', student.bearer);
    expect(on.body.data.bookmarked).toBe(true);

    const off = await api().post(`/api/bookmarks/${id}`).set('Authorization', student.bearer);
    expect(off.body.data.bookmarked).toBe(false);
  });
});
