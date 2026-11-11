/**
 * tokenService — issue/verify the app's own JWTs (used by the 'local' auth
 * provider). Two token types:
 *   - access  : short-lived, sent as Bearer token on every API request
 *   - refresh : longer-lived, used to mint a new access token
 */
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, email: user.email, name: user.name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: String(user._id) }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

export default { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
