import { clsx } from 'clsx';

/** Tiny classnames helper. `cn('a', cond && 'b')` -> 'a b'. */
export const cn = (...args) => clsx(...args);

export default cn;
