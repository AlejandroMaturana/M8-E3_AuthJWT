const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const sequelize = require("./config/db"); // Nuestra config de DB
const Usuario = require("./models/Usuario"); // El modelo de los usuarios

const app = express();
const PORT = 3000;

// Una clave súper secreta para firmar los JWT.
// ¡OJO!: En producción, esto VA en el .env por seguridad. 🤐
const SECRET_KEY = "miClaveMaestraSuperSegura123";

// Middleware para entender JSON (¡Súper importante!)
app.use(express.json());

// Servimos archivos estáticos de la carpeta public para nuestra interfaz frontend
app.use(express.static(path.join(__dirname, "public")));

// --- ENDPOINTS PARA LA GESTIÓN DE NODOS HYDROCONNECT ---

// 1. Registro de Nuevas Estaciones (POST /register)
app.post("/register", async (req, res) => {
  const { username, password, email } = req.body;

  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Identificador y clave de red son obligatorios" });
    }

    const existe = await Usuario.findOne({ where: { username } });
    if (existe) {
      console.log(
        `📡 [Alerta]: Intento de duplicidad para el nodo: ${username}`,
      );
      return res
        .status(409)
        .json({ error: "Ese identificador de estación ya está registrado." });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const nuevoUsuario = await Usuario.create({
      username,
      password: hashedPassword,
      email: email || null,
    });

    console.log(`\n🌱 --- Nueva Estación Integrada a la Red ---`);
    console.log(`UUID: ${nuevoUsuario.id}`);
    console.log(`Nodo: ${nuevoUsuario.username}`);

    res.status(201).json({
      mensaje: "¡Estación vinculada exitosamente a HydroConnect!",
      username: nuevoUsuario.username,
    });
  } catch (error) {
    console.error("❌ Error en la vinculación del nodo:", error.message);
    res
      .status(500)
      .json({ error: "Falla crítica en el registro del nodo de red." });
  }
});

// 2. Acceso y Generación de Credencial (POST /login)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { username } });
    if (!usuario) {
      console.log(`⚠️  Fallo de acceso: Nodo '${username}' no identificado.`);
      return res
        .status(401)
        .json({ error: "Acceso denegado (Nodo no registrado)." });
    }

    const esCorrecta = await bcrypt.compare(password, usuario.password);
    if (!esCorrecta) {
      console.log(`⚠️  Fallo de acceso para '${username}': Clave inválida.`);
      return res
        .status(401)
        .json({ error: "Acceso denegado (Hash mismatch)." });
    }

    const payload = {
      id: usuario.id,
      username: usuario.username,
      rol: "Supervisor de Cultivo", // Rol industrial
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });

    console.log(`📡 Sincronización exitosa con estación: ${username}`);
    res.status(200).json({
      mensaje: "Autenticación de enlace exitosa",
      token: token,
    });
  } catch (error) {
    console.error("❌ Error en el enlace de datos:", error.message);
    res.status(500).json({ error: "No se pudo establecer el enlace seguro." });
  }
});

// --- MIDDLEWARE DE AUTENTICACIÓN: El Firewall de Cultivo 💂‍♂️ ---

function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(403)
      .json({ error: "Acceso bloqueado. Se requiere firma digital Bearer." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const datosValidados = jwt.verify(token, SECRET_KEY);
    req.user = datosValidados;
    console.log(
      `📈 Acceso al panel de monitoreo por: ${datosValidados.username}`,
    );
    next();
  } catch (error) {
    console.log("🚫 Intento de intrusión: Credencial caducada o corrupta.");
    res
      .status(403)
      .json({ error: "Firma digital inválida o enlace expirado." });
  }
}

// --- RUTA PROTEGIDA (GET /perfil) ---

app.get("/perfil", verificarToken, (req, res) => {
  res.status(200).json({
    mensaje: "Acceso total al Panel de Datos Hidropónicos concedido.",
    usuario: req.user,
  });
});

// Inicio del sistema HydroConnect
sequelize
  .sync({ force: false })
  .then(() => {
    console.log(
      "\n💧 [Sistema]: Enlace con base de datos hidropónica establecido.",
    );
    app.listen(PORT, () => {
      console.log(`\n🚀 HydroConnect MVP Iniciado en puerto: ${PORT}`);
      console.log(`- POST /register -> Alta de Nodo`);
      console.log(`- POST /login    -> Sincronizar Operador`);
      console.log(`- GET  /perfil   -> Monitoreo en Tiempo Real\n`);
    });
  })
  .catch((err) => {
    console.error("❌ Desconexión crítica del sistema:", err.message);
  });
