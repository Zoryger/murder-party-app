import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/auth.controller';
import { validate }    from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Règles de validation
const registerRules = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Pseudo : 3 à 30 caractères.'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe : 6 caractères minimum.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', registerRules, validate, register);
router.post('/login',    loginRules,    validate, login);
router.get('/me',        requireAuth,   getMe);

export default router;