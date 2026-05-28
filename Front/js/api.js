/* ============================================================
   api.js — Cliente HTTP centralizado
   Todas las peticiones al backend pasan por aquí.
   ============================================================ */

const API_URL = "http://localhost:3000";

/**
 * Realiza una petición al backend.
 * Inyecta el JWT automáticamente si está guardado en localStorage.
 * Lanza un Error con el mensaje del servidor si la respuesta no es ok.
 */
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // Si el token expiró o es inválido, limpiar sesión y redirigir
  if (response.status === 401 && localStorage.getItem("token")) {
    localStorage.clear();
    window.location.href = "/login.html";
    return;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Error desconocido del servidor");
  }

  return data;
}

// Atajos para los métodos HTTP más usados
const api = {
  get: (path) => apiFetch(path),
  post: (path, body) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) =>
    apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: "DELETE" }),
};
