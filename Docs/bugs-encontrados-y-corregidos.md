# Bugs encontrados y corregidos durante las pruebas

## StockManager — Práctica de Pruebas Universitaria

**Fecha de detección:** 2026-05-28  
**Herramienta usada:** Playwright 1.60.0 (modo headed, Chrome)  
**Tests afectados:** 6 de 20 casos de prueba fallaban en la primera ejecución

---

## Resumen ejecutivo

Al correr los 20 tests de Playwright por primera vez se detectaron **6 fallos** distribuidos en 3 módulos. Todos correspondían a defectos reales en el código del sistema (no en los tests). A continuación se documenta cada bug con su causa raíz, evidencia y la corrección aplicada.

---

## Bug #1 — API redirige a login en respuestas 401 aunque no haya sesión activa

### Casos afectados
- CP-LOGIN-002 | Login con contraseña incorrecta
- CP-LOGIN-004 | Login con usuario no registrado
- CP-LOGIN-005 | Login con formato de email inválido

### Síntoma
El `#alert` de error nunca se mostraba. En el test de email inválido, la validación `el.validity.valid` devolvía `true` cuando debía devolver `false`.

### Causa raíz
`Front/js/api.js` manejaba cualquier respuesta `401` recargando la página y limpiando el `localStorage`, sin distinguir si el 401 era por **sesión expirada** (usuario autenticado cuyo token ya no sirve) o por **credenciales incorrectas** (usuario que nunca estuvo autenticado).

El endpoint `POST /api/auth/login` retorna 401 cuando las credenciales son incorrectas. Cuando el usuario del formulario de login intentaba entrar con contraseña equivocada, la función `apiFetch` interceptaba ese 401, ejecutaba `window.location.href = "/login.html"`, recargaba la página y descartaba el mensaje de error antes de que el handler del formulario pudiera mostrarlo.

### Archivo afectado
`Front/js/api.js` — línea 28

### Código antes (incorrecto)
```js
if (response.status === 401) {
  localStorage.clear();
  window.location.href = "/login.html";
  return;
}
```

### Código después (correcto)
```js
// Solo redirigir si había una sesión activa (token expirado o inválido)
if (response.status === 401 && localStorage.getItem("token")) {
  localStorage.clear();
  window.location.href = "/login.html";
  return;
}
```

### Por qué funciona la corrección
Si no hay token en `localStorage`, el usuario no está autenticado — el 401 es simplemente "credenciales incorrectas" y debe propagarse al `catch` del formulario para mostrar el mensaje de error. La redirección solo tiene sentido cuando hay una sesión activa que expiró.

---

## Bug #2 — El atributo `maxlength` impedía validar nombres mayores a 100 caracteres

### Caso afectado
- CP-PROD-005 | Crear producto con nombre mayor a 100 caracteres

### Síntoma
Al ingresar un nombre de 150 caracteres, el error de validación `#name-error` nunca aparecía y el formulario se enviaba sin error.

### Causa raíz
El `<input name="name">` del formulario de productos tenía el atributo `maxlength="100"`. El navegador trunca automáticamente cualquier valor al límite configurado, **incluso cuando el valor se escribe programáticamente** (como hace Playwright con `page.fill()`). Por lo tanto, cuando el test llenaba el campo con 150 caracteres, el navegador lo recortaba a 100 antes de que el JavaScript leyera el valor. La condición `name.length > 100` en `products.js` nunca era verdadera.

### Archivo afectado
`Front/products-form.html` — campo `input[name="name"]`

### Código antes (incorrecto)
```html
<input
  type="text"
  id="name"
  name="name"
  placeholder="Ej: Perfume Rosas 50ml"
  maxlength="100"
/>
```

### Código después (correcto)
```html
<input
  type="text"
  id="name"
  name="name"
  placeholder="Ej: Perfume Rosas 50ml"
/>
```

### Por qué funciona la corrección
Al eliminar `maxlength`, el navegador no trunca el valor. El JavaScript en `products.js` puede leer los 150 caracteres y la condición `name.length > 100` se evalúa correctamente, mostrando el `#name-error`.

> **Nota:** El backend también rechaza nombres mayores a 100 caracteres (validación de doble capa). La validación del frontend es más amigable para el usuario porque evita una llamada de red innecesaria.

---

## Bug #3 — El formulario de ventas siempre mostraba "Agrega al menos un producto"

### Casos afectados
- CP-VENTA-001 | Crear venta con productos en stock
- CP-VENTA-002 | Venta con cantidad mayor al stock disponible

### Síntoma
- CP-VENTA-001: El formulario no se enviaba al backend y no se redirigía a `sales.html`. El test fallaba con `TimeoutError: page.waitForURL exceeded 10000ms`.
- CP-VENTA-002: El error `#items-error` se mostraba en lugar de `#alert` (el error de stock del backend nunca llegaba).

### Causa raíz
`Front/js/sales.js` declaraba un array global `let saleItems = []` que **nunca se populaba**. La función `addItemRow()` creaba filas en el DOM pero no añadía nada a `saleItems`. Al enviar el formulario, la validación `if (saleItems.length === 0)` siempre era `true`, por lo que el formulario bloqueaba el envío mostrando el error "Agrega al menos un producto" incluso cuando sí había filas con productos seleccionados.

Curiosamente, los casos que verificaban ausencia de cliente (CP-VENTA-004) o ausencia de productos eliminándolos manualmente (CP-VENTA-005) pasaban correctamente porque su flujo de validación terminaba antes de llegar a la comprobación de `saleItems`.

### Archivo afectado
`Front/js/sales.js` — función `initSaleForm()`, validación del submit

### Código antes (incorrecto)
```js
// saleItems nunca se populaba — siempre era []
if (saleItems.length === 0) {
  showFieldError("items-error", "Agrega al menos un producto");
  hasError = true;
} else {
  hideFieldError("items-error");
}

// Validar filas del DOM (más abajo)
const rows = document.querySelectorAll(".sale-item-row");
rows.forEach((row) => { ... });
```

### Código después (correcto)
```js
// Contar filas reales del DOM — fuente de verdad
const rows = document.querySelectorAll(".sale-item-row");
if (rows.length === 0) {
  showFieldError("items-error", "Agrega al menos un producto");
  hasError = true;
} else {
  hideFieldError("items-error");
}

// Reutilizar `rows` para validar cada fila
rows.forEach((row) => { ... });
```

### Por qué funciona la corrección
La validación ahora pregunta directamente cuántas filas `.sale-item-row` existen en el DOM, que es la misma fuente de verdad que usa el bloque de construcción de `items` más adelante. El array `saleItems` quedó inutilizado y podría eliminarse en una refactorización futura.

---

## Bug adicional — Acumulación de datos de prueba entre ejecuciones

### Caso afectado
- CP-VENTA-001 (segunda ejecución en adelante)

### Síntoma
Al ejecutar el suite más de una vez, los productos creados por los tests anteriores (ej: `Perfume Test 1748XXXX`, `Producto Stock Cero`, `AAAA...`) se acumulaban en la base de datos. Como los productos se ordenaban por nombre (`ORDER BY name ASC`), los productos con nombres que empezaban por "A" aparecían primeros en el select del formulario de ventas. El test seleccionaba el producto de mayor índice con stock insuficiente (stock=1), pedía 2 unidades y el backend rechazaba la operación.

### Archivos afectados
- `Back/src/controllers/products.controller.js` — cláusula ORDER BY
- `tests/global-setup.ts` — faltaba limpieza de datos entre ejecuciones

### Correcciones aplicadas

**1. Ordenamiento defensivo en el backend:**

```js
// Antes
ORDER BY name ASC

// Después
ORDER BY stock DESC, name ASC
```

Los productos con más stock (los del seed: 20–100 unidades) siempre aparecen primero, haciendo que el test seleccione un producto con stock suficiente.

**2. Limpieza automática en el setup de Playwright:**

Se añadió lógica al `global-setup.ts` que, antes de cada ejecución:
- Elimina todos los productos que no pertenecen al seed original (identifica los 5 productos por nombre exacto)
- Restaura el stock original de los productos del seed si fue modificado por ventas anteriores

Esto garantiza que la base de datos esté en un estado conocido al inicio de cada ejecución del suite.

---

## Tabla resumen

| Bug | Archivo(s)               | Tipo          | Casos afectados            |
|-----|--------------------------|---------------|---------------------------|
| #1  | `Front/js/api.js`        | Lógica        | CP-LOGIN-002, 004, 005    |
| #2  | `Front/products-form.html` | HTML/validación | CP-PROD-005             |
| #3  | `Front/js/sales.js`      | Lógica        | CP-VENTA-001, 002         |
| #4  | `Back/…/products.controller.js`, `tests/global-setup.ts` | Datos de prueba | CP-VENTA-001 (runs 2+) |

---

## Resultado final

| Ejecución     | Tests pasados | Tests fallidos |
|---------------|--------------|----------------|
| Antes de fixes | 14 / 20      | 6 / 20         |
| Después de fixes | **20 / 20** | **0 / 20**   |
