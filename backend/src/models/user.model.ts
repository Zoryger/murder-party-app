export interface User {
  id:           number;
  username:     string;
  email:        string;
  passwordHash: string;
  createdAt:    Date;
}

// Stockage en mémoire — remplacé par MySQL en Phase 4
const users: User[] = [];
let nextId = 1;

export const UserModel = {
  findAll(): User[] {
    return users;
  },

  findById(id: number): User | undefined {
    return users.find(u => u.id === id);
  },

  findByEmail(email: string): User | undefined {
    return users.find(u => u.email === email);
  },

  findByUsername(username: string): User | undefined {
    return users.find(u => u.username === username);
  },

  create(data: { username: string; email: string; passwordHash: string }): User {
    const user: User = { id: nextId++, ...data, createdAt: new Date() };
    users.push(user);
    return user;
  },
};