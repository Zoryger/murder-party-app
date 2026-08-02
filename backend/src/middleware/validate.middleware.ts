import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// À placer après les règles express-validator dans une route
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Données invalides.',
      errors:  errors.array(),
    });
    return;
  }
  next();
}