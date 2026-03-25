const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Definimos el modelo de Usuario que usaremos para nuestro sistema de autenticación
// Guardar el nombre de usuario y el hash de la contraseña es lo básico que necesitamos
const Usuario = sequelize.define(
  "Usuario",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // ¡Vital! No queremos dos usuarios con el mismo nombre
    },
    // IMPORTANTE: Aquí NO guardamos texto plano, sino el hash que genere bcrypt
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Un campo extra por si queremos extenderlo luego (Opcional pero pro)
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
  },
  {
    tableName: "usuarios",
    timestamps: true, // Registramos cuándo se dio de alta para nuestro control
  },
);

module.exports = Usuario;
