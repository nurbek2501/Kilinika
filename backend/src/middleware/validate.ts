import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const zodErr = result.error as ZodError;
      const messages = zodErr.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`);
      sendError(res, messages.join(', '), 422);
      return;
    }
    req.body = result.data;
    next();
  };
}
