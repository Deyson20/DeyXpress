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
let productos = []; // Se llena desde la DB

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
      
      <button onclick="event.stopPropagation(); verDetalleDesdeString('${p.id}')" class="mt-3 border border-indigo-600 text-indigo-600 py-2 w-full rounded-xl font-bold text-xs mb-2">Ver Detalle</button>
      
      <button onclick="event.stopPropagation(); comprarDirecto(${p.id})" class="bg-indigo-600 text-white py-2 w-full rounded-xl font-bold text-xs shadow-md shadow-indigo-100">Comprar Directo</button>
    `;
    div.onclick = () => showProductDetail(p);
    grid.appendChild(div);
  });
}

// Función auxiliar para el botón "Ver Detalle"
window.verDetalleDesdeString = function(id) {
    const p = productos.find(prod => prod.id == id);
    if(p) showProductDetail(p);
}

// 5. NAVEGACIÓN Y DETALLE
function showProductDetail(product) {
  currentProduct = product;
  document.title = product.name + " | DEYXPRESS";
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
        
        <div class="space-y-3">
            <div class="flex gap-3">
                <input id="detailQty" type="number" min="1" value="1" class="w-20 text-center border rounded-xl font-bold text-lg">
                <button onclick="addToCartFromDetail()" class="flex-1 bg-white border-2 border-indigo-600 text-indigo-600 py-4 rounded-xl font-bold hover:bg-indigo-50 transition">Añadir al Pedido</button>
            </div>
            
            <button onclick="comprarDirectoDesdeDetail()" class="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                <i class="fas fa-bolt"></i> COMPRAR AHORA
            </button>
            <button onclick="compartirProductoIndividual()" class="w-full py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition">
                <i class="fas fa-share-alt"></i> Compartir este producto
            </button>
        </div>
      </div>
    </div>`;
}

function showCatalog() {
  document.title = "DEYXPRESS - Pago Contraentrega";
  productDetailView.classList.add("hidden");
  orderFormView.classList.add("hidden");
  catalogView.classList.remove("hidden");
}

// 6. GESTIÓN DEL CARRITO
function updateCart() {
  localStorage.setItem("cart_deyxpress", JSON.stringify(cart));
  if (!cartItems) return;
  cartItems.innerHTML = "";
  
  if (cart.length === 0) {
    cartItems.innerHTML = `<div class="flex flex-col items-center justify-center py-12 text-slate-400"><p class="font-bold uppercase text-xs">Tu carrito está vacío</p></div>`;
    if (cartTotal) cartTotal.textContent = formatter.format(0);
    if (cartCounter) cartCounter.innerText = "0";
    return;
  }
  
  let total = 0, count = 0;
  cart.forEach((item, index) => {
    total += item.price * item.qty;
    count += item.qty;
    const div = document.createElement("div");
    div.className = "bg-white p-3 rounded-xl flex flex-col border mb-2 shadow-sm";
    div.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1">
          <p class="font-bold text-xs text-slate-800">${item.name}</p>
          <p class="text-[10px] text-indigo-600 font-bold">${formatter.format(item.price)} c/u</p>
        </div>
        <button onclick="removeFromCart(${index})" class="text-red-400"><i class="fas fa-trash-alt text-xs"></i></button>
      </div>`;
    cartItems.appendChild(div);
  });
  cartTotal.textContent = formatter.format(total);
  cartCounter.textContent = count;
}

function addToCartFromDetail() {
  const qty = parseInt(document.getElementById("detailQty").value);
  const variantInput = document.getElementById("variantSelect");
  const selectedVariant = variantInput ? variantInput.value : null;
  const existing = cart.find(i => i.id === currentProduct.id && i.selectedVariant === selectedVariant);
  if (existing) { existing.qty += qty; } else { cart.push({ ...currentProduct, qty, selectedVariant }); }
  updateCart();
  if (cartSidebar.classList.contains("translate-x-full")) toggleCart();
}

function removeFromCart(index) { cart.splice(index, 1); updateCart(); }
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

function comprarDirecto(productId) {
  const p = productos.find(item => item.id === productId);
  if (!p) return;
  cart = [{ ...p, qty: 1, selectedVariant: p.variants && p.variants.length > 0 ? p.variants[0] : null }];
  updateCart();
  confirmOrder();
}

// 8. MOTOR DE INICIALIZACIÓN (SQLITE)
async function iniciarTiendaConDB() {
  try {
    const SQL = await initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
    });
    
    const response = await fetch('tienda.db');
    if (!response.ok) throw new Error("Archivo tienda.db no encontrado");
    
    const arrayBuffer = await response.arrayBuffer();
    const db = new SQL.Database(new Uint8Array(arrayBuffer));
    const res = db.exec("SELECT * FROM productos");
    
    if (res.length > 0) {
      const columnas = res[0].columns;
      const filas = res[0].values;
      productos = filas.map(fila => {
        let obj = {};
        columnas.forEach((col, i) => {
          if (col === 'images' || col === 'variants') {
            try { obj[col] = JSON.parse(fila[i]); } catch (e) { obj[col] = []; }
          } else { obj[col] = fila[i]; }
        });
        return obj;
      });
    }
    
    loadCategories();
    renderProducts();
    updateCart();

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('pid');
    if (productId) {
      const prod = productos.find(p => p.id == productId);
      if (prod) showProductDetail(prod);
    }

    if (searchInput) searchInput.addEventListener("input", (e) => renderProducts(e.target.value));
    if (searchInputMobile) searchInputMobile.addEventListener("input", (e) => renderProducts(e.target.value));

  } catch (error) {
    console.error("Error DB:", error);
    if (grid) grid.innerHTML = `<p class="text-center py-20 text-red-500">Error al cargar el catálogo .db</p>`;
  }
}

document.addEventListener("DOMContentLoaded", iniciarTiendaConDB);

// --- FUNCIONES ADICIONALES ---
function toggleMobileSearch() {
  const container = document.getElementById("mobileSearchContainer");
  if (container) container.classList.toggle("hidden");
}

function comprarDirectoDesdeDetail() {
  if (!currentProduct) return;
  const qty = parseInt(document.getElementById("detailQty").value) || 1;
  const variantInput = document.getElementById("variantSelect");
  cart = [{ ...currentProduct, qty, selectedVariant: variantInput ? variantInput.value : null }];
  updateCart();
  confirmOrder();
}

function compartirProductoIndividual() {
  const url = `${window.location.origin}${window.location.pathname}?pid=${currentProduct.id}`;
  if (navigator.share) { navigator.share({ title: currentProduct.name, url }); }
  else { navigator.clipboard.writeText(url); alert("Copiado!"); }
}

// WHATSAPP Y NAVEGACIÓN (Resto del código original simplificado)
document.getElementById("orderForm")?.addEventListener("submit", function(e) {
  e.preventDefault();
  // ... (Aquí va tu lógica de WhatsApp que ya tienes)
  alert("Redirigiendo a WhatsApp...");
});
