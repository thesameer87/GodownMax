// errors.ts
import createHttpError from 'http-errors';

export const createError = (message: string, status: number = 500) => {
  return createHttpError(status, message);
};
