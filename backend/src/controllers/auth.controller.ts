import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';

// POST /api/auth/register
export async function register(req: Request, res: Response): Promise<void> {
  const { username, email, password } = req.body;

  // Vérifier que l'email n'est pas déjà utilisé
  if (UserModel.findByEmail(email)) {
    res.status(409).json({ success: false, message: 'Email déjà utilisé.' });
    return;
  }
  if (UserModel.findByUsername(username)) {
    res.status(409).json({ success: false, message: 'Nom d\'utilisateur déjà pris.' });
    return;
  }

  // Hasher le mot de passe (10 = nombre de rounds, bon équilibre sécurité/perf)
  const passwordHash = await bcrypt.hash(password, 10);
  const user = UserModel.create({ username, email, passwordHash });

  // Créer le JWT
  const token = jwt.sign(
    { userId: user.id, username: user.username, email: user.email },
    process.env['JWT_SECRET']!,
    { expiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d' } as object,
  );

  res.status(201).json({
    success: true,
    message: 'Compte créé avec succès.',
    data: {
      token,
      user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
    },
  });
}

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = UserModel.findByEmail(email);
  if (!user) {
    res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
    return;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, email: user.email },
    process.env['JWT_SECRET']!,
    { expiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d' } as object,
  );

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
    },
  });
}

// GET /api/auth/me  (route protégée)
export function getMe(req: Request, res: Response): void {
  // req.user est injecté par le middleware requireAuth
  const user = UserModel.findById(req.user!.userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    return;
  }
  res.json({
    success: true,
    data: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
  });
}