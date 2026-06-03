const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'quizz',
  process.env.DB_USER || 'quizz',
  process.env.DB_PASSWORD || 'quizz_secret',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV !== 'production' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

async function syncDatabase() {
  await sequelize.authenticate();
  console.log('✅ Connexion PostgreSQL établie.');
  await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
  console.log('✅ Base de données synchronisée.');
}

module.exports = { sequelize, syncDatabase };
