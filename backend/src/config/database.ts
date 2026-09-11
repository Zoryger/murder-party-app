import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env['DB_NAME']     ?? 'murder_party',
  process.env['DB_USER']     ?? 'root',
  process.env['DB_PASSWORD'] ?? '',
  {
    host:    process.env['DB_HOST'] ?? 'localhost',
    port:    Number(process.env['DB_PORT'] ?? 3306),
    dialect: 'mysql',
    logging: process.env['NODE_ENV'] === 'development'
      ? (sql: string) => console.log(`\x1b[36m[SQL]\x1b[0m ${sql}`)
      : false,
    pool: {
      max: 5, min: 0, acquire: 30000, idle: 10000,
    },
  }
);

export default sequelize;