// La variable 'productos' ya viene cargada desde productos.js

document.addEventListener('DOMContentLoaded', () => {
    // Inicializamos la tienda
    loadCategories();
    renderProducts();
    updateCart(); // Carga el carrito guardado
    checkUrlParameters();
});

const grid = document.getElementById("productGrid");
const categoriesMenuList = document.getElementById("categoriesMenuList");
const cartSidebar = document.getElementById("cartSidebar");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCounter = document.getElementById("cartCounter");

// Vistas
const catalogView = document.getElementById("catalogView");
const productDetailView = document.getElementById("productDetailView");
const detailContent = document.getElementById("detailContent");

// Buscador y Formateador
const searchInput = document.getElementById("searchInput");
const searchInputMobile = document.getElementById("searchInputMobile");
const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

let cart = JSON.parse(localStorage.getItem("cart_deyxpress")) || [];
let currentProduct = null;
let currentCategory = "Todos";

// --- FUNCIONES PRINCIPALES ---

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
      toggleCategoriesMenu();
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
    subtitleEl.textContent = currentCategory === "Todos" ? "Explora nuestro catálogo completo" : `Mostrando lo mejor en ${currentCategory.toLowerCase()}`;
  }

  const filtered = productos
    .filter(p => (currentCategory === "Todos" || p.category === currentCategory))
    .filter(p => p.name.toLowerCase().includes(filterTerm.toLowerCase()));
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full py-20 text-center"><p class="text-slate-500">No hay productos.</p></div>`;
    return;
  }
  
  filtered.forEach(p => {
    const div = document.createElement("div");
    div.className = "bg-white p-4 rounded-2xl shadow hover:shadow-lg transition cursor-pointer group";
    div.innerHTML = `
      <div class="overflow-hidden rounded-xl mb-3 h-40 flex items-center justify-center bg-slate-50">
        <img src="${p.images[0]}" class="max-h-full object-contain group-hover:scale-110 transition-transform duration-500">
      </div>
      <h3 class="font-bold text-sm h-10 line-clamp-2">${p.name}</h3>
      <p class="font-black text-indigo-600 mt-2">${formatter.format(p.price)}</p>
      <button class="mt-3 bg-indigo-600 text-white py-2 w-full rounded-xl text-sm font-bold">Ver producto</button>
    `;
    div.onclick = () => showProductDetail(p);
    grid.appendChild(div);
  });
}

function showProductDetail(product) {
  currentProduct = product;
  catalogView.classList.add("hidden");
  productDetailView.classList.remove("hidden");
  window.scrollTo(0, 0);
  
  const descFormateada = product.description ? product.description.replace(/\n/g, '<br>') : '';
  const videoHTML = product.video ? `<div class="aspect-video mb-4"><iframe src="${product.video}" class="w-full h-full rounded-xl" frameborder="0"></iframe></div>` : '';
  
  detailContent.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-3xl shadow-sm border">
      <div>
        <img id="mainDetailImg" src="${product.images[0]}" class="w-full h-80 object-contain rounded-2xl bg-slate-50 border">
        <div class="flex gap-2 mt-4 overflow-x-auto pb-2">
          ${product.images.map(img => `<img src="${img}" onclick="document.getElementById('mainDetailImg').src='${img}'" class="h-20 w-20 object-cover rounded-lg border cursor-pointer hover:border-indigo-500">`).join('')}
        </div>
      </div>
      <div class="text-left">
        <h2 class="text-2xl font-extrabold mb-4">${product.name}</h2>
        ${videoHTML}
        <p class="text-slate-500 text-sm mb-6">${descFormateada}</p>
        <p class="text-indigo-600 text-3xl font-black mb-6">${formatter.format(product.price)}</p>
        <button onclick="addToCartFromDetail()" class="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">Añadir al Pedido</button>
      </div>
    </div>
  `;
}

// --- FUNCIONES DEL CARRITO ---

function updateCart() {
  localStorage.setItem("cart_deyxpress", JSON.stringify(cart));
  if (!cartItems) return;
  cartItems.innerHTML = "";
  let total = 0, count = 0;
  
  cart.forEach((item, index) => {
    total += item.price * item.qty;
    count += item.qty;
    const div = document.createElement("div");
    div.className = "bg-white p-3 rounded-xl flex justify-between items-center border mb-2";
    div.innerHTML = `
      <div class="flex-1 text-xs"><b>${item.name}</b><br>${formatter.format(item.price)}</div>
      <div class="flex items-center gap-2">
        <button onclick="changeQty(${index}, -1)" class="w-6 h-6 bg-slate-100 rounded-full">−</button>
        <span class="font-bold">${item.qty}</span>
        <button onclick="changeQty(${index}, 1)" class="w-6 h-6 bg-slate-100 rounded-full">+</button>
      </div>
    `;
    cartItems.appendChild(div);
  });
  
  if(cartTotal) cartTotal.textContent = formatter.format(total);
  if(cartCounter) cartCounter.textContent = count;
}

function addToCartFromDetail() {
  const qty = 1;
  const existing = cart.find(i => i.id === currentProduct.id);
  if (existing) existing.qty += qty;
  else cart.push({ ...currentProduct, qty });
  updateCart();
  toggleCart();
}

function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  updateCart();
}

function toggleCart() { cartSidebar.classList.toggle("translate-x-full"); }
function showCatalog() { productDetailView.classList.add("hidden"); catalogView.classList.remove("hidden"); }
function toggleCategoriesMenu() { document.getElementById("categoriesMenu").classList.toggle("hidden"); }

// --- WHATSAPP ---
function confirmOrder() {
  if (!cart.length) return alert("Carrito vacío");
  let msg = "🛒 *Pedido DEYXPRESS*%0A%0A";
  cart.forEach(i => msg += `• ${i.name} x${i.qty}%0A`);
  msg += `%0A💰 *Total: ${formatter.format(cart.reduce((s, i) => s + i.price * i.qty, 0))}*`;
  window.open(`https://wa.me/573166093629?text=${msg}`, "_blank");
}

function checkUrlParameters() {
  const productId = new URLSearchParams(window.location.search).get('id');
  if (productId) {
    const p = productos.find(x => x.id == productId);
    if (p) showProductDetail(p);
  }
}

// --- ACTIVAR BUSCADOR ---
if (searchInput) {
    searchInput.addEventListener("input", (e) => renderProducts(e.target.value));
}

if (searchInputMobile) {
    searchInputMobile.addEventListener("input", (e) => renderProducts(e.target.value));
}

// Función para abrir/cerrar el buscador en celulares
function toggleMobileSearch() {
    const mobileSearch = document.getElementById("mobileSearch");
    if (mobileSearch) {
        mobileSearch.classList.toggle("hidden");
    }
}
