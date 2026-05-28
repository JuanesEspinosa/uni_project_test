/* ============================================================
   sales.js — Lista de ventas y formulario (carrito)
   ============================================================ */

// ── Página: lista de ventas ────────────────────────────────
async function initSales() {
  requireAuth();
  renderUserInfo();

  const tbody = document.getElementById("sales-tbody");
  const emptyEl = document.getElementById("empty-state");

  try {
    const sales = await api.get("/api/sales");

    if (sales.length === 0) {
      tbody.innerHTML = "";
      emptyEl.style.display = "block";
      return;
    }

    emptyEl.style.display = "none";
    tbody.innerHTML = sales
      .map(
        (s) => `
      <tr>
        <td>#${s.id}</td>
        <td>${escapeHtml(s.client_name || "—")}</td>
        <td>${escapeHtml(s.user_name || "—")}</td>
        <td class="fw-bold">$${formatNumber(s.total)}</td>
        <td class="text-muted">${formatDate(s.created_at)}</td>
      </tr>
    `,
      )
      .join("");
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">${error.message}</td></tr>`;
  }
}

// ── Página: formulario de nueva venta (carrito) ────────────
let availableProducts = [];
let saleItems = []; // [{ productId, name, unitPrice, quantity }]

async function initSaleForm() {
  requireAuth();
  renderUserInfo();

  const alertEl = document.getElementById("alert");
  const clientSel = document.getElementById("client-id");
  const submitBtn = document.getElementById("submit-btn");

  // Cargar clientes y productos en paralelo
  try {
    const [clients, products] = await Promise.all([
      api.get("/api/clients"),
      api.get("/api/products"),
    ]);

    availableProducts = products;

    // Poblar select de clientes
    clientSel.innerHTML =
      `<option value="">-- Selecciona un cliente --</option>` +
      clients
        .map(
          (c) => `<option value="${c.id}">${escapeHtml(c.full_name)}</option>`,
        )
        .join("");
  } catch (error) {
    showAlert(alertEl, "Error al cargar datos: " + error.message);
    return;
  }

  // Botón agregar item
  document.getElementById("btn-add-item").addEventListener("click", addItemRow);

  // Formulario submit
  document.getElementById("sale-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const clientId = document.getElementById("client-id").value;
    const notes = document.getElementById("notes").value.trim();

    let hasError = false;

    if (!clientId) {
      showFieldError("client-error", "Selecciona un cliente");
      hasError = true;
    } else {
      hideFieldError("client-error");
    }

    const rows = document.querySelectorAll(".sale-item-row");
    if (rows.length === 0) {
      showFieldError("items-error", "Agrega al menos un producto");
      hasError = true;
    } else {
      hideFieldError("items-error");
    }

    // Validar que todas las filas tengan producto y cantidad > 0
    rows.forEach((row) => {
      const productSel = row.querySelector(".item-product");
      const qtyInput = row.querySelector(".item-qty");
      if (!productSel.value) {
        productSel.classList.add("invalid");
        hasError = true;
      } else {
        productSel.classList.remove("invalid");
      }
      if (!qtyInput.value || Number(qtyInput.value) <= 0) {
        qtyInput.classList.add("invalid");
        hasError = true;
      } else {
        qtyInput.classList.remove("invalid");
      }
    });

    if (hasError) return;

    // Construir items desde el DOM (fuente de verdad final)
    const items = [];
    rows.forEach((row) => {
      items.push({
        productId: Number(row.querySelector(".item-product").value),
        quantity: Number(row.querySelector(".item-qty").value),
      });
    });

    submitBtn.disabled = true;
    submitBtn.textContent = "Registrando...";
    hideAlert(alertEl);

    try {
      await api.post("/api/sales", {
        clientId: Number(clientId),
        notes,
        items,
      });
      window.location.href = "/sales.html";
    } catch (error) {
      showAlert(alertEl, error.message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Registrar Venta";
    }
  });

  // Agregar primera fila vacía
  addItemRow();
}

// ── Agrega una fila de item al formulario ──────────────────
function addItemRow() {
  const container = document.getElementById("items-container");

  const row = document.createElement("div");
  row.className = "sale-item-row";

  const productOptions = availableProducts
    .map(
      (
        p,
      ) => `<option value="${p.id}" data-price="${p.price}" data-stock="${p.stock}">
      ${escapeHtml(p.name)} (stock: ${p.stock})
    </option>`,
    )
    .join("");

  row.innerHTML = `
    <div>
      <select class="item-product">
        <option value="">-- Producto --</option>
        ${productOptions}
      </select>
      <div class="item-info text-muted" style="font-size:11px;margin-top:4px;"></div>
    </div>
    <input type="number" class="item-qty" placeholder="Cant." min="1" value="1">
    <div class="item-subtotal fw-bold" style="text-align:right;font-size:13px;">$0</div>
    <button type="button" class="btn-remove-item" onclick="removeItemRow(this)">✕</button>
  `;

  const productSel = row.querySelector(".item-product");
  const qtyInput = row.querySelector(".item-qty");
  const infoEl = row.querySelector(".item-info");
  const subtotalEl = row.querySelector(".item-subtotal");

  // Actualizar info y subtotal cuando cambia el producto o la cantidad
  function updateRow() {
    const selected = productSel.options[productSel.selectedIndex];
    const price = selected ? Number(selected.dataset.price) || 0 : 0;
    const stock = selected ? Number(selected.dataset.stock) : 0;
    const qty = Number(qtyInput.value) || 0;

    if (price > 0) {
      infoEl.textContent = `$${formatNumber(price)} c/u · Stock: ${stock}`;
    } else {
      infoEl.textContent = "";
    }

    subtotalEl.textContent = `$${formatNumber(price * qty)}`;
    updateTotal();
  }

  productSel.addEventListener("change", updateRow);
  qtyInput.addEventListener("input", updateRow);

  container.appendChild(row);
  updateTotal();
}

// ── Elimina una fila de item ───────────────────────────────
function removeItemRow(btn) {
  btn.closest(".sale-item-row").remove();
  updateTotal();
}

// ── Recalcula el total de la venta ─────────────────────────
function updateTotal() {
  let total = 0;
  let itemCount = 0;

  document.querySelectorAll(".sale-item-row").forEach((row) => {
    const selected =
      row.querySelector(".item-product").options[
        row.querySelector(".item-product").selectedIndex
      ];
    const price = selected ? Number(selected.dataset.price) || 0 : 0;
    const qty = Number(row.querySelector(".item-qty").value) || 0;
    if (price > 0 && qty > 0) {
      total += price * qty;
      itemCount++;
    }
  });

  const totalEl = document.getElementById("sale-total");
  const itemCountEl = document.getElementById("item-count");

  if (totalEl) totalEl.textContent = `$${formatNumber(total)}`;
  if (itemCountEl) itemCountEl.textContent = itemCount;
}

// ── Utilidades compartidas ─────────────────────────────────
function formatNumber(n) {
  return Number(n).toLocaleString("es-CO");
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
