import { Response } from 'express';

export function sendSuccess(res: Response, data: any = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, message });
}

export function sendError(res: Response, message = 'Error', statusCode = 400, data: any = null) {
  return res.status(statusCode).json({ success: false, data, message });
}
