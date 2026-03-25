## 🛠️ E3-M8 Ejercicio

### **Ejercicio: Registro y Auténticación con JWT y Rutas Protegidas 🔐**

**Objetivo:**  Implementar un flujo de  **registro y autenticación**  completo basado en JSON Web Tokens (JWT). Aprenderás a registrar un nuevo usuario (guardando su contraseña de forma segura), a generar un token después de un login exitoso, y a crear un middleware de autenticación para proteger rutas, asegurando que solo los usuarios con un token válido puedan acceder a ellas.

----------

### **Paso 1: Instalación y Configuración Inicial**

1.  **Instala los Paquetes:**  Necesitaremos  `jsonwebtoken`  para los tokens y  `bcryptjs`  para hashear las contraseñas de forma segura.
    
    ```
    pnpm install jsonwebtoken bcryptjs
    ```
    
2.  **Configuración en  `app.js`:**
    
    -   **Clave Secreta:**  Un JWT se firma con una clave secreta para asegurar su integridad. Defínela como una constante.
        
        ```
        const SECRET_KEY = 'tuClaveSecretaSuperSegura123'; // ¡En un proyecto real, usa variables de entorno!
        ```
        
    -   **Almacenamiento de Usuarios (Simulado):**  Como no usaremos una base de datos, simularemos el almacenamiento de usuarios con un array en memoria.
        
        ```
        const users = []; // Aquí guardaremos nuestros usuarios registrados
        ```
        

### **Paso 2: Creación del Endpoint de Registro**

**Endpoint:**  `POST /register`  **Descripción:**  Permite a un nuevo usuario crear una cuenta.

**Lógica a Implementar:**

1.  **Recibir Datos:**  Obtén  `username`  y  `password`  del  `req.body`.
    
2.  **Validar Usuario:**  Verifica si el  `username`  ya existe en nuestro array  `users`. Si es así, devuelve un error 409 (Conflict).
    
3.  **Hashear la Contraseña:**  **Nunca guardes contraseñas en texto plano.**  Usa  `bcryptjs`  para crear un "hash" seguro de la contraseña.
    
    ```
    const hashedPassword = await bcrypt.hash(password, 10); // El 10 es el "cost factor" o "salt rounds"
    ```
    
4.  **Guardar Nuevo Usuario:**  Crea un objeto para el nuevo usuario con su  `username`  y la  `hashedPassword`, y guárdalo en el array  `users`.
    
5.  **Responder:**  Envía una respuesta de éxito (código 201 - Created).
    
    **Ejemplo de implementación en  `app.js`:**
    
    ```
    const bcrypt = require('bcryptjs');
    
    app.post('/register', async (req, res) => {
      const { username, password } = req.body;
    
      // Validar que el usuario no exista
      const userExists = users.find(u => u.username === username);
      if (userExists) {
        return res.status(409).json({ error: 'El nombre de usuario ya está en uso.' });
      }
    
      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
    
      // Guardar el nuevo usuario
      const newUser = { username, password: hashedPassword };
      users.push(newUser);
    
      console.log('Usuario registrado:', newUser); // Para depuración
      res.status(201).json({ mensaje: 'Usuario registrado exitosamente.' });
    });
    ```
    

### **Paso 3: Creación del Endpoint de Login**

**Endpoint:**  `POST /login`  **Descripción:**  Autentica a un usuario existente y, si es exitoso, le devuelve un JWT.

**Lógica a Implementar:**

1.  **Buscar Usuario:**  Encuentra al usuario en el array  `users`  por su  `username`. Si no existe, devuelve un error 401 (Unauthorized).
    
2.  **Verificar Contraseña:**  Usa  `bcrypt.compare()`  para comparar la contraseña enviada en el  `req.body`  con el hash que tenemos guardado. Si no coinciden, devuelve un error 401.
    
3.  **Crear Payload y Generar Token:**  Si la contraseña es correcta, crea el  `payload`  (sin datos sensibles) y genera el token con  `jwt.sign()`.
    
4.  **Devolver el Token:**  Envía el token al cliente.
    

**Ejemplo de implementación:**

```
const jwt = require('jsonwebtoken');

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Buscar al usuario
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  // Comparar contraseñas
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  // Crear payload y token
  const payload = { username: user.username, rol: 'usuario' };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });

  res.json({ token });
});
```

### **Paso 4: Creación del Middleware de Verificación**

Este middleware es el "guardia de seguridad" de nuestras rutas. Se ejecuta antes que el controlador final para validar el token.

```
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payloadDecodificado = jwt.verify(token, SECRET_KEY);
    req.usuario = payloadDecodificado; // Guardamos el payload en req
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
}
```

### **Paso 5: Creación de la Ruta Protegida**

Esta es la ruta a la que solo se puede acceder con un token válido, gracias a la acción del middleware.

```
app.get('/perfil', verificarToken, (req, res) => {
  // Gracias al middleware, req.usuario contiene los datos del token
  res.json({ 
    mensaje: 'Acceso concedido al perfil', 
    usuario: req.usuario 
  });
});
```

### **Paso 6: Interfaz de Usuario y Pruebas en el Navegador**

Para probar el flujo completo, crea una carpeta  `public`  y dentro de ella los siguientes archivos.

1.  **`public/register.html`:**
    
2.  **`public/login.html`:**
    
3.  **`public/client.js`:**
    
    -   Este archivo contendrá la lógica para enviar los datos de los formularios usando  `fetch`, guardar el token en  `localStorage`  y usarlo para acceder a la ruta protegida.
        

----------

### **Conceptos a Aplicar:**

-   **Bcrypt.js:**  Librería para el hashing de contraseñas.  `bcrypt.hash()`  para crear el hash y  `bcrypt.compare()`  para verificarlo.
    
-   **Flujo de Registro:**  El proceso de validar y guardar un nuevo usuario de forma segura.
    
-   **JSON Web Token (JWT):**  Estándar para crear tokens de acceso.  `jwt.sign()`  y  `jwt.verify()`.
    
-   **Middleware:**  Funciones que se ejecutan en el ciclo de solicitud-respuesta.
    
-   **Header  `Authorization`:**  Encabezado estándar para enviar credenciales, usando el esquema  `Bearer`.
    
-   **`localStorage`:**  Almacenamiento en el navegador para guardar el token del lado del cliente.
    
-   **API  `fetch`:**  Para la comunicación asíncrona entre el cliente (navegador) y el servidor.
    

### **Entrega:**

El trabajo deberá ser entregado a través de un  **repositorio público en GitHub**. El proyecto debe ser completamente funcional, permitiendo registrar un usuario, iniciar sesión para obtener un token, y usar ese token para acceder a la ruta de perfil. Comparte únicamente el enlace al repositorio. 📤
