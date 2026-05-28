/* ============================================================
   products.js — Lista y formulario de productos
   ============================================================ */

// ── Página: lista de productos ─────────────────────────────
async function initProducts() {
  requireAuth();
  renderUserInfo();

  const tbody = document.getElementById("products-tbody");
  const emptyEl = document.getElementById("empty-state");

  try {
    const products = await api.get("/api/products");

    if (products.length === 0) {
      tbody.innerHTML = "";
      emptyEl.style.display = "block";
      return;
    }

    emptyEl.style.display = "none";
    tbody.innerHTML = products
      .map(
        (p) => `
      <tr>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category || "—")}</td>
        <td>$${formatNumber(p.price)}</td>
        <td>
          <span class="badge ${p.stock === 0 ? "badge-error" : p.stock < 10 ? "badge-warning" : "badge-success"}">
            ${p.stock}
          </span>
        </td>
        <td class="text-right">
          <a href="products-form.html?id=${p.id}" class="btn btn-secondary btn-sm">Editar</a>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id}, '${escapeHtml(p.name)}')">Eliminar</button>
        </td>
      </tr>
    `,
      )
      .join("");
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">${error.message}</td></tr>`;
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`¿Eliminar el producto "${name}"?`)) return;

  try {
    await api.delete(`/api/products/${id}`);
    initProducts();
  } catch (error) {
    alert("Error al eliminar: " + error.message);
  }
}

// ── Página: formulario crear / editar producto ─────────────
async function initProductForm() {
  requireAuth();
  renderUserInfo();

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const isEdit = Boolean(productId);

  const titleEl = document.getElementById("form-title");
  const submitBtn = document.getElementById("submit-btn");
  const alertEl = document.getElementById("alert");
  const form = document.getElementById("product-form");

  titleEl.textContent = isEdit ? "Editar Producto" : "Nuevo Producto";
  submitBtn.textContent = isEdit ? "Guardar cambios" : "Crear Producto";

  // Si es edición, cargar datos actuales
  if (isEdit) {
    try {
      const products = await api.get("/api/products");
      const product = products.find((p) => p.id === Number(productId));

      if (!product) {
        showAlert(alertEl, "Producto no encontrado");
        return;
      }

      document.getElementById("name").value = product.name;
      document.getElementById("description").value = product.description || "";
      document.getElementById("price").value = product.price;
      document.getElementById("stock").value = product.stock;
      document.getElementById("category").value = product.category || "";
    } catch (error) {
      showAlert(alertEl, error.message);
      return;
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const description = document.getElementById("description").value.trim();
    const price = document.getElementById("price").value;
    const stock = document.getElementById("stock").value;
    const category = document.getElementById("category").value.trim();

    // Validaciones
    let hasError = false;

    if (!name) {
      showFieldError("name-error", "El nombre es requerido");
      hasError = true;
    } else if (name.length > 100) {
      showFieldError("name-error", "El nombre no puede superar 100 caracteres");
      hasError = true;
    } else {
      hideFieldError("name-error");
    }

    if (price === "" || price === null) {
      showFieldError("price-error", "El precio es requerido");
      hasError = true;
    } else if (Number(price) < 0) {
      showFieldError("price-error", "El precio no puede ser negativo");
      hasError = true;
    } else {
      hideFieldError("price-error");
    }

    if (stock !== "" && Number(stock) < 0) {
      showFieldError("stock-error", "El stock no puede ser negativo");
      hasError = true;
    } else {
      hideFieldError("stock-error");
    }

    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.textContent = isEdit ? "Guardando..." : "Creando...";
    hideAlert(alertEl);

    const body = {
      name,
      description,
      price: Number(price),
      stock: Number(stock || 0),
      category,
    };

    try {
      if (isEdit) {
        await api.put(`/api/products/${productId}`, body);
      } else {
        await api.post("/api/products", body);
      }
      window.location.href = "/products.html";
    } catch (error) {
      showAlert(alertEl, error.message);
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? "Guardar cambios" : "Crear Producto";
    }
  });
}

// ── Utilidades ─────────────────────────────────────────────
function formatNumber(n) {
  return Number(n).toLocaleString("es-CO");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
