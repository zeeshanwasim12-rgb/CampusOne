import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/index.js';
import { signAccessToken } from '../src/services/tokenService.js';
import { ROLES } from '../src/utils/constants.js';

/** Create a user of a given role and return { user, token, auth() header helper }. */
export async function makeUser(role = ROLES.STUDENT, overrides = {}) {
  const user = await User.create({
    name: overrides.name || `${role} user`,
    email: overrides.email || `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}@test.edu`,
    password: 'Passw0rd!',
    role,
    ...overrides,
  });
  const token = signAccessToken(user);
  return { user, token, bearer: `Bearer ${token}` };
}

export const api = () => request(app);
