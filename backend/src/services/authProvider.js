/**
 * authProvider — resolves an incoming bearer token to a User document,
 * regardless of which auth backend is configured.
 *
 *   local   -> verify our own JWT (tokenService) and load the user by id.
 *   cognito -> verify the Cognito-issued JWT against the pool's public JWKS,
 *              then find (or just-in-time create) the linked local User so the
 *              rest of the app can keep using Mongo user ids + roles.
 *
 * Swapping providers is a single env var (AUTH_PROVIDER) — no controller code
 * changes. This is the seam a real Cognito deployment plugs into.
 */
import { config, effectiveAuthProvider } from '../config/env.js';
import { verifyAccessToken } from './tokenService.js';
import { User } from '../models/User.js';
import { ROLES } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';

// ---- Cognito JWKS verification (lazy) ----
let jwksClient = null;
let jwtLib = null;

async function verifyCognitoToken(token) {
  if (!jwksClient) {
    const jwksModule = await import('jwks-rsa');
    jwtLib = (await import('jsonwebtoken')).default;
    const { region, cognito } = config.aws;
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${cognito.userPoolId}`;
    jwksClient = jwksModule.default({ jwksUri: `${issuer}/.well-known/jwks.json` });
  }

  const { region, cognito } = config.aws;
  const issuer = `https://cognito-idp.${region}.amazonaws.com/${cognito.userPoolId}`;

  const getKey = (header, callback) => {
    jwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) return callback(err);
      callback(null, key.getPublicKey());
    });
  };

  return new Promise((resolve, reject) => {
    jwtLib.verify(token, getKey, { issuer, algorithms: ['RS256'] }, (err, decoded) => {
      if (err) return reject(ApiError.unauthorized('Invalid Cognito token'));
      resolve(decoded);
    });
  });
}

/**
 * Given a raw bearer token, return the corresponding Mongoose User (or throw).
 */
export async function resolveUserFromToken(token) {
  const provider = effectiveAuthProvider();

  if (provider === 'cognito') {
    const claims = await verifyCognitoToken(token);
    const sub = claims.sub;
    let user = await User.findOne({ cognitoSub: sub });
    if (!user) {
      // Just-in-time provisioning of the local mirror record.
      user = await User.create({
        cognitoSub: sub,
        email: claims.email || `${sub}@cognito.local`,
        name: claims.name || claims['cognito:username'] || 'CampusOne User',
        role: claims['custom:role'] || ROLES.STUDENT,
      });
    }
    return user;
  }

  // local
  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (!user.isActive) throw ApiError.forbidden('Account is disabled');
  return user;
}

export default { resolveUserFromToken };
