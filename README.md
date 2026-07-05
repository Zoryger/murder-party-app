# Murder Party App

Application web de murder party en ligne, jouable sur PC et mobile.

## Stack technique
- **Frontend** : Angular 17+ (TypeScript) — déployé sur Vercel
- **Backend** : Node.js + Express (TypeScript) — déployé sur Render.com
- **Base de données** : MySQL — déployé sur Railway

## Lancer en local

### Prérequis
- Node.js v20+
- MySQL (XAMPP)
- Angular CLI (`npm install -g @angular/cli`)

### Frontend
```bash
cd frontend
npm install
ng serve
```

### Backend
```bash
cd backend
npm install
npm run dev
```

## Fonctionnalités
- Création de parties avec thème et joueurs
- Génération automatique des rôles et relations
- Système de pouvoirs (12 pouvoirs avec interactions)
- Indices débloqués via codes physiques
- Temps réel avec Socket.io
- Vote final