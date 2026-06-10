import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { createError } from '../utils/errors';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({ body: req.body, query: req.query, params: req.params });
      next();
    } catch (err: any) {
      const errors = err.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw createError(errors || 'Validation failed', 400);
    }
  };
};
