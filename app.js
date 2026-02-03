// 1. VARIABLES DE ELEMENTOS
const grid = document.getElementById("productGrid");
const categoriesMenuList = document.getElementById("categoriesMenuList");
const cartSidebar = document.getElementById("cartSidebar");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCounter = document.getElementById("cartCounter");

// 2. VISTAS
const catalogView = document.getElementById("catalogView");
const productDetailView = document.getElementById("productDetailView");
const detailContent = document.getElementById("detailContent");
const orderFormView = document.getElementById("orderFormView");

// 3. CONFIGURACIÓN
const searchInput = document.getElementById("searchInput");
const searchInputMobile = document.getElementById("searchInputMobile");
const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

let cart = JSON.parse(localStorage.getItem("cart_deyxpress")) || [];
let currentProduct = null;
let currentCategory = "Todos";

// 4. FUNCIONES DE CARGA Y RENDERIZADO
function loadCategories() {
  if (!categoriesMenuList) return;
  const cats = ["Todos", ...new Set(productos.map(p => p.category))];
  categoriesMenuList.innerHTML = "";
  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.className = "text-left px-4 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition";
    btn.onclick = () => {
      currentCategory = cat;
      showCatalog();
      renderProducts();
      if (document.getElementById("categoriesMenu")) {
        document.getElementById("categoriesMenu").classList.add("hidden");
      }
    };
    categoriesMenuList.appendChild(btn);
  });
}

function renderProducts(filterTerm = "") {
  if (!grid) return;
  grid.innerHTML = "";
  
  const titleEl = document.getElementById("categoryTitle");
  const subtitleEl = document.getElementById("categorySubtitle");

  if (titleEl && subtitleEl) {
    titleEl.textContent = currentCategory === "Todos" ? "Todos los productos" : currentCategory;
    subtitleEl.textContent = currentCategory === "Todos" ? "Explora nuestro catálogo completo" : `Lo mejor en ${currentCategory.toLowerCase()}`;
  }

  const filtered = productos
    .filter(p => (currentCategory === "Todos" || p.category === currentCategory))
    .filter(p => p.name.toLowerCase().includes(filterTerm.toLowerCase()));
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full py-20 text-center"><p class="text-slate-500">No se encontraron productos.</p></div>`;
    return;
  }
  
  filtered.forEach(p => {
    const div = document.createElement("div");
    div.className = "bg-white p-4 rounded-2xl shadow hover:shadow-lg transition cursor-pointer";
    div.innerHTML = `
      <img src="${p.images[0]}" class="h-40 w-full object-contain mb-3" alt="${p.name}">
      <h3 class="font-bold text-sm h-10 line-clamp-2">${p.name}</h3>
      <p class="font-black text-indigo-600 mt-2">${formatter.format(p.price)}</p>
      <button class="mt-3 bg-indigo-600 text-white py-2 w-full rounded-xl font-bold">Ver producto</button>
    `;
    div.onclick = () => showProductDetail(p);
    grid.appendChild(div);
  });
}

// 5. NAVEGACIÓN Y DETALLE
function showProductDetail(product) {
  currentProduct = product;
  catalogView.classList.add("hidden");
  orderFormView.classList.add("hidden");
  productDetailView.classList.remove("hidden");
  window.scrollTo(0, 0);
  
  const desc = product.description ? product.description.replace(/\n/g, '<br>') : 'Sin descripción';
  const variantsHTML = product.variants && product.variants.length > 0 ?
    `<div class="mt-4"><p class="text-xs font-bold mb-2">ELEGIR OPCIÓN:</p><select id="variantSelect" class="w-full p-3 rounded-xl border">${product.variants.map(v => `<option value="${v}">${v}</option>`).join('')}</select></div>` : '';
  
  detailContent.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-3xl border shadow-sm">
      <img src="${product.images[0]}" class="w-full h-80 object-contain rounded-2xl bg-slate-50 border">
      <div class="text-left">
        <h2 class="text-2xl font-extrabold text-slate-800">${product.name}</h2>
        <div class="text-slate-500 mt-4 text-sm leading-relaxed">${desc}</div>
        ${variantsHTML}
        <p class="text-indigo-600 text-3xl font-black my-6">${formatter.format(product.price)}</p>
        <div class="flex gap-3">
            <input id="detailQty" type="number" min="1" value="1" class="w-20 text-center border rounded-xl font-bold text-lg">
            <button onclick="addToCartFromDetail()" class="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">Añadir al Pedido</button>
        </div>
      </div>
    </div>`;
}

function showCatalog() {
  productDetailView.classList.add("hidden");
  orderFormView.classList.add("hidden");
  catalogView.classList.remove("hidden");
}

// 6. GESTIÓN DEL CARRITO
function addToCartFromDetail() {
  const qty = parseInt(document.getElementById("detailQty").value);
  const variantInput = document.getElementById("variantSelect");
  const selectedVariant = variantInput ? variantInput.value : null;
  
  const existing = cart.find(i => i.id === currentProduct.id && i.selectedVariant === selectedVariant);
  
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...currentProduct, qty, selectedVariant });
  }
  
  updateCart();
  if (cartSidebar.classList.contains("translate-x-full")) toggleCart();
}

function updateCart() {
  localStorage.setItem("cart_deyxpress", JSON.stringify(cart));
  if (!cartItems) return;
  
  cartItems.innerHTML = "";
  let total = 0,
    count = 0;
  
  cart.forEach((item, index) => {
    total += item.price * item.qty;
    count += item.qty;
    const div = document.createElement("div");
    div.className = "bg-white p-3 rounded-xl flex flex-col border mb-2 shadow-sm";
    div.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1">
          <p class="font-bold text-xs text-slate-800 leading-tight">${item.name} ${item.selectedVariant ? `(${item.selectedVariant})` : ''}</p>
          <p class="text-[10px] text-indigo-600 font-bold mt-1">${formatter.format(item.price)} c/u</p>
        </div>
        <button onclick="removeFromCart(${index})" class="text-red-400 hover:text-red-600 pl-2"><i class="fas fa-trash-alt text-xs"></i></button>
      </div>
      
      <div class="flex justify-between items-center bg-slate-50 rounded-lg p-1">
        <div class="flex items-center gap-3">
          <button onclick="changeQty(${index}, -1)" class="w-7 h-7 flex items-center justify-center bg-white border rounded-md shadow-sm active:scale-90 transition-transform">
            <i class="fas fa-minus text-[10px] text-slate-600"></i>
          </button>
          <span class="font-black text-sm text-slate-700 w-4 text-center">${item.qty}</span>
          <button onclick="changeQty(${index}, 1)" class="w-7 h-7 flex items-center justify-center bg-white border rounded-md shadow-sm active:scale-90 transition-transform">
            <i class="fas fa-plus text-[10px] text-slate-600"></i>
          </button>
        </div>
        <p class="font-black text-xs text-slate-800">${formatter.format(item.price * item.qty)}</p>
      </div>`;
    cartItems.appendChild(div);
  });
  
  cartTotal.textContent = formatter.format(total);
  cartCounter.textContent = count;
}

function changeQty(index, delta) {
    // Delta es 1 para sumar y -1 para restar
    cart[index].qty += delta;

    // Si la cantidad llega a 0, eliminamos el producto del carrito
    if (cart[index].qty <= 0) {
        removeFromCart(index);
    } else {
        updateCart();
    }
}


function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function toggleCart() { cartSidebar.classList.toggle("translate-x-full"); }
function toggleCategoriesMenu() { document.getElementById("categoriesMenu").classList.toggle("hidden"); }

// 7. FORMULARIO DE PEDIDO
function confirmOrder() {
  if (!cart.length) return alert("Añade productos primero");
  catalogView.classList.add("hidden");
  productDetailView.classList.add("hidden");
  if (!cartSidebar.classList.contains("translate-x-full")) toggleCart();
  orderFormView.classList.remove("hidden");
  window.scrollTo(0, 0);
}

function closeOrderForm() {
  orderFormView.classList.add("hidden");
  catalogView.classList.remove("hidden");
}

// 8. INICIALIZACIÓN (EL MOTOR)
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  renderProducts();
  updateCart();
  
   // --- INICIO: Lógica para leer carrito compartido ---
  const urlParams = new URLSearchParams(window.location.search);
  const cartData = urlParams.get('cart');

  if (cartData) {
      try {
          const decodedCart = JSON.parse(atob(cartData));
          const newCart = decodedCart.map(itemUrl => {
              const pBase = productos.find(p => p.id == itemUrl.id);
              if (pBase) {
                  return {
                      ...pBase,
                      qty: itemUrl.qty,
                      selectedVariant: itemUrl.v
                  };
              }
              return null;
          }).filter(item => item !== null);

          if (newCart.length > 0) {
              cart = newCart;
              updateCart();
              alert("¡Hemos cargado los productos del carrito compartido!");
          }
      } catch (e) {
          console.error("Error al cargar carrito compartido", e);
      }
  }
  
  // Eventos de búsqueda
  if (searchInput) searchInput.addEventListener("input", (e) => renderProducts(e.target.value));
  if (searchInputMobile) searchInputMobile.addEventListener("input", (e) => renderProducts(e.target.value));
});

function toggleMobileSearch() {
  const searchBar = document.getElementById("searchInputMobile");
  searchBar.classList.toggle("hidden");
}

// Agrega esto al final de app.js para que el botón de buscar funcione
function toggleMobileSearch() {
  const container = document.getElementById("mobileSearchContainer");
  if(container) container.classList.toggle("hidden");
}

// MANEJO DEL ENVÍO DEL FORMULARIO A WHATSAPP
document.getElementById("orderForm").addEventListener("submit", function (e) {
  e.preventDefault(); // Evita que la página se recargue

  // 1. Datos del cliente
  const nombre = document.getElementById("nombre").value;
  const telefono = document.getElementById("telefono").value;
  const ciudad = document.getElementById("ciudad").value;
  const direccion = document.getElementById("direccion").value;
  const referencia = document.getElementById("referencia").value;
  const horario = document.getElementById("horario").value;
  
  // 2. Días seleccionados
  const dias = Array.from(document.querySelectorAll('input[name="dias"]:checked'))
    .map(el => el.value).join(", ");

  // 3. Resumen de productos
  let mensajeProductos = "";
  let totalPedido = 0;

  cart.forEach(item => {
    mensajeProductos += `- ${item.name} ${item.selectedVariant ? `(${item.selectedVariant})` : ''} x${item.qty}\n`;
    totalPedido += item.price * item.qty;
  });

  // 4. Configuración del mensaje
  const numeroWhatsApp = "573166093629"; // CAMBIA ESTO por tu número real (incluye código de país)
  
  const texto = `*NUEVO PEDIDO - DEYXPRESS*\n\n` +
    `*Cliente:* ${nombre}\n` +
    `*Celular:* ${telefono}\n` +
    `*Ciudad:* ${ciudad}\n` +
    `*Dirección:* ${direccion}\n` +
    `*Referencia:* ${referencia}\n` +
    `*Días entrega:* ${dias}\n` +
    `*Horario:* ${horario}\n\n` +
    `*PRODUCTOS:*\n${mensajeProductos}\n` +
    `*TOTAL A PAGAR:* ${formatter.format(totalPedido)}\n\n` +
    `¡Espero mi pedido!`;

  // 5. Abrir WhatsApp
  const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
});

// --- SISTEMA DE NAVEGACIÓN "ATRÁS" PARA MÓVILES ---

// 1. Función para registrar un paso en el historial
function registrarPaso(nombre) {
    window.history.pushState({ view: nombre }, "");
}

// 2. Lógica del botón atrás físico o gesto
window.onpopstate = function(event) {
    // A. Si el menú de CATEGORÍAS está abierto, cerrarlo
    const categoriesMenu = document.getElementById("categoriesMenu");
    if (categoriesMenu && !categoriesMenu.classList.contains("hidden")) {
        toggleCategoriesMenu();
        return; 
    }

    // B. Si el CARRITO está abierto, cerrarlo
    if (!cartSidebar.classList.contains("translate-x-full")) {
        toggleCart();
        return;
    }

    // C. Si estamos en el DETALLE DE PRODUCTO, volver al catálogo
    if (!productDetailView.classList.contains("hidden")) {
        showCatalog();
        return;
    }

    // D. Si estamos en el FORMULARIO DE PEDIDO, volver al catálogo
    if (!orderFormView.classList.contains("hidden")) {
        closeOrderForm();
        return;
    }
};

// 3. VINCULAR CON LAS FUNCIONES EXISTENTES
// Debes asegurarte de que al abrir estos elementos, se registre el paso en el historial

// Para el Carrito
const originalToggleCart = toggleCart;
toggleCart = function() {
    const abriendo = cartSidebar.classList.contains("translate-x-full");
    originalToggleCart();
    if (abriendo) registrarPaso("carrito");
};

// Para el Menú de Categorías
const originalToggleCategories = toggleCategoriesMenu;
toggleCategoriesMenu = function() {
    const menu = document.getElementById("categoriesMenu");
    const abriendo = menu.classList.contains("hidden");
    originalToggleCategories();
    if (abriendo) registrarPaso("categorias");
};

// Para el Detalle de Producto
const originalShowProductDetail = showProductDetail;
showProductDetail = function(product) {
    originalShowProductDetail(product);
    registrarPaso("detalle");
};

// Para el Formulario de Pedido
const originalConfirmOrder = confirmOrder;
confirmOrder = function() {
    if (!cart.length) return alert("Añade productos primero");
    originalConfirmOrder();
    registrarPaso("formulario");
};
