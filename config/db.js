const { Sequelize } = require("sequelize");
require("dotenv").config();

// Iniciamos la conexión con Sequelize usando los datos del .env
// Es fundamental para que nuestra aplicación persevere los datos ;)
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false, // Dejamos la consola limpita desactivando el log de SQL
  },
);

module.exports = sequelize;
