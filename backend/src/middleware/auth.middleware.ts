import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/sequelize';
import { AuthPayload } from '../types/express';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Cherche le token dans le header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token manquant ou invalide.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, process.env['JWT_SECRET']!) as AuthPayload;
  } catch {
    res.status(401).json({ success: false, message: 'Token expiré ou invalide.' });
    return;
  }

  const user = await User.findByPk(payload.userId, { attributes: ['id'] });
  if (!user) {
    res.status(401).json({ success: false, message: 'Compte introuvable. Veuillez vous reconnecter.' });
    return;
  }

  req.user = payload;
  next();
}