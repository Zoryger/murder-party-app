import { BaseEntity } from './common.types';

export interface User extends BaseEntity {
  username:     string;
  email:        string;
  // Le mot de passe n'est jamais renvoyé par l'API
}

export interface RegisterDto {
  username: string;
  email:    string;
  password: string;
}

export interface LoginDto {
  email:    string;
  password: string;
}

export interface AuthResponse {
  user:  User;
  token: string; // JWT
}