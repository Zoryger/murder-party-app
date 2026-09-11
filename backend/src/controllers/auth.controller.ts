import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt    from 'jsonwebtoken';
import { User } from '../models/sequelize';

export async function register(req: Request, res: Response): Promise<void> {
  const { username, email, password } = req.body;

  const existingEmail    = await User.findOne({ where: { email } });
  const existingUsername = await User.findOne({ where: { username } });

  if (existingEmail) {
    res.status(409).json({ success: false, message: 'Email déjà utilisé.' });
    return;
  }
  if (existingUsername) {
    res.status(409).json({ success: false, message: 'Pseudo déjà pris.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, passwordHash });

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

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
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

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await User.findByPk(req.user!.userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    return;
  }
  res.json({
    success: true,
    data: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
  });
}