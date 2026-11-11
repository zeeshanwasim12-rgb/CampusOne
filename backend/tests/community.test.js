import { describe, it, expect } from 'vitest';
import { api, makeUser } from './helpers.js';
import { ROLES } from '../src/utils/constants.js';

describe('Community', () => {
  it('creates a post, lists it, likes and comments', async () => {
    const author = await makeUser(ROLES.STUDENT);
    const other = await makeUser(ROLES.STUDENT);

    const created = await api()
      .post('/api/community/posts')
      .set('Authorization', author.bearer)
      .send({ title: 'Doubt in DBMS', body: 'Explain 3NF please', category: 'Doubts', tags: ['dbms'] });
    expect(created.status).toBe(201);
    const postId = created.body.data._id;

    const list = await api().get('/api/community/posts');
    expect(list.body.data.some((p) => p._id === postId)).toBe(true);

    // Like from another user.
    const like = await api().post(`/api/community/posts/${postId}/like`).set('Authorization', other.bearer);
    expect(like.body.data.liked).toBe(true);
    expect(like.body.data.likeCount).toBe(1);

    // Comment.
    const comment = await api()
      .post(`/api/community/posts/${postId}/comments`)
      .set('Authorization', other.bearer)
      .send({ body: 'BCNF is stricter than 3NF' });
    expect(comment.status).toBe(201);

    const comments = await api().get(`/api/community/posts/${postId}/comments`);
    expect(comments.body.data.length).toBe(1);
  });

  it('validates that a post requires a title and body', async () => {
    const { bearer } = await makeUser(ROLES.STUDENT);
    const res = await api().post('/api/community/posts').set('Authorization', bearer).send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('lets an admin hide a reported post', async () => {
    const author = await makeUser(ROLES.STUDENT);
    const reporter = await makeUser(ROLES.STUDENT);
    const admin = await makeUser(ROLES.ADMIN);

    const created = await api()
      .post('/api/community/posts')
      .set('Authorization', author.bearer)
      .send({ title: 'Spam', body: 'buy now', category: 'General' });
    const postId = created.body.data._id;

    await api().post(`/api/community/posts/${postId}/report`).set('Authorization', reporter.bearer).send({ reason: 'spam' });

    const reported = await api().get('/api/admin/moderation/reported').set('Authorization', admin.bearer);
    expect(reported.body.data.length).toBe(1);

    const hidden = await api()
      .patch(`/api/admin/moderation/posts/${postId}`)
      .set('Authorization', admin.bearer)
      .send({ isHidden: true });
    expect(hidden.body.data.isHidden).toBe(true);

    // Hidden post no longer visible to a regular student.
    const viewer = await makeUser(ROLES.STUDENT);
    const list = await api().get('/api/community/posts').set('Authorization', viewer.bearer);
    expect(list.body.data.some((p) => p._id === postId)).toBe(false);
  });
});
