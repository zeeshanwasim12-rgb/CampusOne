/**
 * validate — runs express-validator chains and, if any failed, throws a 400
 * with a clean field->message list. Usage:
 *
 *   router.post('/', validate([ body('email').isEmail() ]), handler)
 */
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export const validate = (validations) => async (req, _res, next) => {
  await Promise.all(validations.map((v) => v.run(req)));
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(ApiError.badRequest('Validation failed', details));
};

export default validate;
