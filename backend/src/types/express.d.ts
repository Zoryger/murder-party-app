// Étend le type Request d'Express pour ajouter l'utilisateur connecté
import { Request } from 'express';

export interface AuthPayload {
  userId: number;
  username: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}