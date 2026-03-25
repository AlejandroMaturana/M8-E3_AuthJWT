/* Lógica del Cliente M8-E3: Registro, Login y Protección de Rutas */
/* Usamos localStorage para guardar el token entre sesiones */

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const messageBox = document.getElementById("message");

  // --- FUNCIÓN PARA MOSTRAR MENSAJES FEEDBACK ---
  function showMessage(text, type = "success") {
    if (!messageBox) return;
    messageBox.textContent = text;
    messageBox.className = type;
    messageBox.style.display = "block";

    // Lo ocultamos a los 5 segundos para que no moleste
    setTimeout(() => {
      messageBox.style.display = "none";
    }, 5000);
  }

  // --- REGISTRO DE USUARIOS ---
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = registerForm.username.value;
      const password = registerForm.password.value;

      try {
        const res = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (res.status === 201) {
          showMessage(data.mensaje, "success");
          // Redirigimos al login después de 2 segundos para que el usuario sepa que salió bien
          setTimeout(() => (window.location.href = "login.html"), 2000);
        } else {
          showMessage(data.error || "Ocurrió un error en el registro", "error");
        }
      } catch (err) {
        showMessage("No se pudo conectar con el servidor.", "error");
      }
    });
  }

  // --- LOGIN DE USUARIOS ---
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = loginForm.username.value;
      const password = loginForm.password.value;

      try {
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (res.status === 200) {
          // ¡ÉXITO! Guardamos la "llave" (token) en el bolsillo (localStorage)
          localStorage.setItem("jwtToken", data.token);
          showMessage("Login exitoso. Redirigiendo...", "success");
          setTimeout(() => (window.location.href = "dashboard.html"), 1000);
        } else {
          showMessage(data.error || "Credenciales incorrectas", "error");
        }
      } catch (err) {
        showMessage("Error de conexión al intentar el login.", "error");
      }
    });
  }

  // --- ÁREA DE PERFIL (DASHBOARD) ---
  if (window.location.pathname.includes("dashboard.html")) {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      // Si no hay token, no pintas nada y te vas directo fuera
      window.location.href = "login.html";
    } else {
      // Pedimos datos al servidor PROTEGIDO usando el token en el Header
      fetch("/perfil", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.status === 403) {
            throw new Error("Token inválido o expirado.");
          }
          return res.json();
        })
        .then((data) => {
          // Rellenamos la UI con los datos reales del payload del token
          const user = data.usuario;
          document.getElementById("welcomeMessage").textContent =
            `¡Hola de nuevo, ${user.username}!`;
          document.getElementById("userId").textContent =
            `#${user.id || "---"}`;
          document.getElementById("userName").textContent = user.username;
          document.getElementById("userRole").textContent =
            user.rol || "Miembro";

          // Ponemos la inicial del nombre en el circulito de avatar
          document.getElementById("userInitial").textContent =
            user.username[0].toUpperCase();
        })
        .catch((err) => {
          console.error(err);
          localStorage.removeItem("jwtToken");
          window.location.href = "login.html";
        });
    }
  }

  // --- CIERRE DE SESIÓN ---
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Simplemente tiramos la llave (borramos el token) y al login
      localStorage.removeItem("jwtToken");
      window.location.href = "login.html";
    });
  }
});
