/* ============================================================
   auth.js — Login, registro, sesión y guard de rutas
   ============================================================ */

// ── Guard: redirige a login si no hay sesión ───────────────
function requireAuth() {
  if (!localStorage.getItem("token")) {
    window.location.href = "/login.html";
  }
}

// ── Guard inverso: redirige al dashboard si ya hay sesión ──
function redirectIfAuthenticated() {
  if (localStorage.getItem("token")) {
    window.location.href = "/dashboard.html";
  }
}

// ── Guardar sesión ─────────────────────────────────────────
function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

// ── Leer usuario de la sesión ──────────────────────────────
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

// ── Cerrar sesión ──────────────────────────────────────────
function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

// ── Mostrar info del usuario en sidebar ────────────────────
function renderUserInfo() {
  const user = getUser();
  if (!user) return;

  const nameEl = document.getElementById("user-name");
  const roleEl = document.getElementById("user-role");
  const avatarEl = document.getElementById("user-avatar");

  if (nameEl) nameEl.textContent = user.fullName || user.email;
  if (roleEl)
    roleEl.textContent = user.role === "admin" ? "Administrador" : "Vendedor";
  if (avatarEl)
    avatarEl.textContent = (user.fullName || user.email)[0].toUpperCase();
}

// ── Lógica de la página de Login ──────────────────────────
function initLogin() {
  redirectIfAuthenticated();

  const form = document.getElementById("login-form");
  const alertEl = document.getElementById("alert");
  const submitBtn = document.getElementById("submit-btn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Validaciones front-end
    let hasError = false;

    if (!email) {
      showFieldError("email-error", "El email es requerido");
      hasError = true;
    } else {
      hideFieldError("email-error");
    }

    if (!password) {
      showFieldError("password-error", "La contraseña es requerida");
      hasError = true;
    } else {
      hideFieldError("password-error");
    }

    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Ingresando...";
    hideAlert(alertEl);

    try {
      const data = await api.post("/api/auth/login", { email, password });
      saveSession(data.token, data.user);
      window.location.href = "/dashboard.html";
    } catch (error) {
      showAlert(alertEl, error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Ingresar";
    }
  });
}

// ── Lógica de la página de Registro ───────────────────────
function initRegister() {
  redirectIfAuthenticated();

  const form = document.getElementById("register-form");
  const alertEl = document.getElementById("alert");
  const successEl = document.getElementById("alert-success");
  const submitBtn = document.getElementById("submit-btn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    let hasError = false;

    if (!fullName) {
      showFieldError("fullName-error", "El nombre es requerido");
      hasError = true;
    } else {
      hideFieldError("fullName-error");
    }

    if (!email) {
      showFieldError("email-error", "El email es requerido");
      hasError = true;
    } else {
      hideFieldError("email-error");
    }

    if (!password || password.length < 6) {
      showFieldError(
        "password-error",
        "La contraseña debe tener al menos 6 caracteres",
      );
      hasError = true;
    } else {
      hideFieldError("password-error");
    }

    if (password !== confirmPassword) {
      showFieldError("confirmPassword-error", "Las contraseñas no coinciden");
      hasError = true;
    } else {
      hideFieldError("confirmPassword-error");
    }

    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Registrando...";
    hideAlert(alertEl);

    try {
      await api.post("/api/auth/register", { fullName, email, password });
      form.reset();
      showAlert(
        successEl,
        "¡Usuario registrado exitosamente! Ahora puedes iniciar sesión.",
        "success",
      );
      hideAlert(alertEl);
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 3000);
    } catch (error) {
      showAlert(alertEl, error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Registrarse";
    }
  });
}

// ── Helpers de UI ──────────────────────────────────────────
function showFieldError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.add("visible");
}

function hideFieldError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("visible");
}

function showAlert(el, message, type = "error") {
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} visible`;
}

function hideAlert(el) {
  if (!el) return;
  el.classList.remove("visible");
}
