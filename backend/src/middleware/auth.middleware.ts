import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types/express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Cherche le token dans le header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token manquant ou invalide.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env['JWT_SECRET']!) as AuthPayload;
    req.user = payload;
    next(); // tout est bon, on passe au controller
  } catch {
    res.status(401).json({ success: false, message: 'Token expiré ou invalide.' });
  }
}