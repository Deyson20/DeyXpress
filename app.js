let productos = []; // Empezamos con la lista vacía

async function cargarProductosDesdeSQL() {
  const urlWorker = "https://deyxpress.pages.dev/"; // <--- PEGA TU ENLACE AQUÍ
  
  try {
    const response = await fetch(urlWorker);
    productos = await response.json(); // Llenamos la lista con lo que hay en SQL
    
    // Ejecutamos las funciones que ya tenías para mostrar todo
    loadCategories();
    renderProducts();
  } catch (error) {
    console.error("No se pudieron cargar los productos:", error);
  }
}

// Reemplaza tu antigua llamada a renderProducts() por esta:
cargarProductosDesdeSQL();


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

function loadCategories() {
  const cats = ["Todos", ...new Set(productos.map(p => p.category))];
  categoriesMenuList.innerHTML = "";
  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.className = "text-left px-4 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition";
    btn.onclick = () => {
      currentCategory = cat;
      showCatalog(); // Obliga a la web a volver a la vista principal
      renderProducts();
      toggleCategoriesMenu();
    };
    categoriesMenuList.appendChild(btn);
  });
}

function renderProducts(filterTerm = "") {
  grid.innerHTML = "";
  
  // Capturamos los elementos del título
  const titleEl = document.getElementById("categoryTitle");
  const subtitleEl = document.getElementById("categorySubtitle");

  // Actualizamos el texto según la categoría actual
  if (titleEl && subtitleEl) {
    if (currentCategory === "Todos") {
      titleEl.textContent = "Todos los productos";
      subtitleEl.textContent = "Explora nuestro catálogo completo";
    } else {
      titleEl.textContent = currentCategory;
      subtitleEl.textContent = `Mostrando lo mejor en ${currentCategory.toLowerCase()}`;
    }
  }

  // Filtrado de productos (esto ya lo tienes)
  const filtered = productos
    .filter(p => (currentCategory === "Todos" || p.category === currentCategory))
    .filter(p => p.name.toLowerCase().includes(filterTerm.toLowerCase()));
  
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-20 text-center">
        <i class="fas fa-search text-slate-300 text-5xl mb-4"></i>
        <p class="text-slate-500 font-medium">No encontramos productos que coincidan.</p>
        <button onclick="location.reload()" class="mt-4 text-indigo-600 underline">Ver todo el catálogo</button>
      </div>`;
    return;
  }
  
  filtered.forEach(p => {
    const div = document.createElement("div");
    div.className = "bg-white p-4 rounded-2xl shadow hover:shadow-lg transition cursor-pointer";
    div.innerHTML = `
      <img src="${p.images[0]}" class="h-40 w-full object-contain mb-3">
      <h3 class="font-bold text-sm h-10 line-clamp-2">${p.name}</h3>
      <p class="font-black text-indigo-600 mt-2">${formatter.format(p.price)}</p>
      <button class="mt-3 bg-indigo-600 text-white py-2 w-full rounded-xl hover:bg-indigo-700 transition text-sm font-bold">Ver producto</button>
    `;
    div.onclick = () => showProductDetail(p);
    grid.appendChild(div);
  });
}

function showProductDetail(product) {
  currentProduct = product;
  const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + product.id;
  window.history.pushState({ path: newUrl }, '', newUrl);
  catalogView.classList.add("hidden");
  productDetailView.classList.remove("hidden");
  window.scrollTo(0, 0);
  
  // --- MEJORA DE DESCRIPCIÓN ---
  // Esta línea convierte los saltos de línea en etiquetas <br> para que el navegador los entienda
  const descripcionFormateada = product.description ? product.description.replace(/\n/g, '<br>') : '';
  
  const mediaVideoHTML = product.video ?
    `<div class="aspect-video rounded-2xl overflow-hidden border bg-black mb-6 shadow-sm">
         <iframe src="${product.video}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
       </div>` :
    '';
  
  const variantsHTML = product.variants && product.variants.length > 0 ?
    `<div class="mt-4">
        <label class="block text-sm font-bold text-slate-700 mb-2 italic">Selecciona una opción:</label>
        <select id="variantSelect" class="w-full p-3 rounded-xl border bg-white font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none border-indigo-100">
          ${product.variants.map(v => `<option value="${v}">${v}</option>`).join('')}
        </select>
      </div>` : '';
  
  detailContent.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-3xl shadow-sm border">
      <div>
        <img id="mainDetailImg" src="${product.images[0]}" class="w-full h-80 object-contain rounded-2xl bg-slate-50 border mb-4">
        <div class="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
          ${product.images.map(img => `
            <img src="${img}" onclick="document.getElementById('mainDetailImg').src='${img}'" 
                 class="h-20 w-20 flex-shrink-0 object-cover rounded-lg border cursor-pointer hover:border-indigo-500">
          `).join('')}
        </div>
      </div>

      <div class="flex flex-col justify-start text-left">
        <span class="text-indigo-600 font-bold uppercase tracking-widest text-xs">${product.category}</span>
       <div class="flex justify-between items-start mt-2 gap-4 mb-6">
    <h2 class="text-2xl font-extrabold leading-tight">${product.name}</h2>
    <button onclick="shareProduct()" class="p-3 bg-slate-100 rounded-full text-indigo-600 hover:bg-indigo-100 transition shadow-sm" title="Compartir producto">
        <i class="fas fa-share-alt"></i>
    </button>
</div>
        
        ${mediaVideoHTML}

        ${variantsHTML} 
        
        <div class="mt-4">
          <h3 class="text-slate-800 font-bold text-sm mb-2 italic">Descripción del producto:</h3>
          <p class="text-slate-500 text-sm leading-relaxed">${descripcionFormateada}</p>
        </div>

        <p class="text-indigo-600 text-3xl font-black my-6">${formatter.format(product.price)}</p>
        
        <div class="flex gap-3 p-4 bg-slate-50 rounded-2xl">
          <input id="detailQty" type="number" min="1" value="1" class="w-16 text-center border rounded-xl font-bold bg-white">
          <button onclick="addToCartFromDetail()" class="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md flex items-center justify-center gap-2">
            <i class="fas fa-cart-plus"></i> Añadir al Pedido
          </button>
        </div>
      </div>
    </div>
  `;
}

// ... (el resto del código se mantiene igual)

function showCatalog() {
  productDetailView.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: 'smooth' }); // Sube la página al inicio automáticamente
  catalogView.classList.remove("hidden");
  const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
  window.history.pushState({ path: cleanUrl }, '', cleanUrl);
}

function addToCartFromDetail() {
  const qtyInput = document.getElementById("detailQty");
  const variantInput = document.getElementById("variantSelect");
  const qty = parseInt(qtyInput.value);
  const selectedVariant = variantInput ? variantInput.value : null;
  
  const existingItem = cart.find(i => i.id === currentProduct.id && i.selectedVariant === selectedVariant);
  
  if (existingItem) {
    existingItem.qty += qty;
  } else {
    cart.push({ ...currentProduct, qty, selectedVariant });
  }
  
  updateCart();
  toggleCart();
}

function updateCart() {
  localStorage.setItem("cart_deyxpress", JSON.stringify(cart));
  cartItems.innerHTML = "";
  let total = 0,
    count = 0;
  
  cart.forEach((item, index) => {
    total += item.price * item.qty;
    count += item.qty;
    const div = document.createElement("div");
    div.className = "bg-white p-3 rounded-xl flex justify-between items-center gap-3 border mb-2 shadow-sm";
    div.innerHTML = `
      <div class="flex-1">
        <p class="font-bold text-xs">${item.name}</p>
        ${item.selectedVariant ? `<p class="text-[10px] text-indigo-500 font-bold uppercase">${item.selectedVariant}</p>` : ''}
        <p class="text-xs text-gray-400 font-bold">${formatter.format(item.price)}</p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="changeQty(${index}, -1)" class="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-full text-xs font-bold">−</button>
        <span class="text-sm font-bold">${item.qty}</span>
        <button onclick="changeQty(${index}, 1)" class="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-full text-xs font-bold">+</button>
      </div>
      <button onclick="removeFromCart(${index})" class="text-red-400 hover:text-red-600"><i class="fas fa-trash-alt text-xs"></i></button>`;
    cartItems.appendChild(div);
  });
  
  cartTotal.textContent = formatter.format(total);
  cartCounter.textContent = count;
}

function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) removeFromCart(index);
  else updateCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function toggleCart() { cartSidebar.classList.toggle("translate-x-full"); }

function toggleCategoriesMenu() { document.getElementById("categoriesMenu").classList.toggle("hidden"); }

function toggleMobileSearch() { document.getElementById("mobileSearch").classList.toggle("hidden"); }

searchInput.addEventListener("input", (e) => renderProducts(e.target.value));
searchInputMobile.addEventListener("input", (e) => renderProducts(e.target.value));

function confirmOrder() {
  if (!cart.length) return alert("El carrito está vacío");
  let msg = "🛒 *Nuevo pedido en DEYXPRESS*%0A%0A";
  cart.forEach(i => {
    const vTxt = i.selectedVariant ? ` (${i.selectedVariant})` : '';
    msg += `• ${i.name}${vTxt} x${i.qty} - ${formatter.format(i.price * i.qty)}%0A`;
  });
  msg += `%0A💰 *Total a Pagar: ${formatter.format(cart.reduce((s, i) => s + i.price * i.qty, 0))}*`;
  msg += `%0A%0A🚚 *Método:* Pago Contraentrega`;
  window.open(`https://wa.me/573166093629?text=${msg}`, "_blank");
}

loadCategories();
renderProducts();
updateCart();

function checkUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  if (productId) {
    const productToOpen = productos.find(p => p.id == productId);
    if (productToOpen) {
      showProductDetail(productToOpen);
    }
  }
}

window.addEventListener('load', checkUrlParameters);

window.addEventListener('popstate', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.get('id')) {
    showCatalog();
  } else {
    checkUrlParameters();
  }
});

function shareProduct() {
  if (!currentProduct) return;
  
  const shareData = {
    title: `DEYXPRESS - ${currentProduct.name}`,
    text: `¡Mira este producto! 🛒 ${currentProduct.name} por solo ${formatter.format(currentProduct.price)}. Pago contraentrega.`,
    url: window.location.href,
  };
  
  if (navigator.share) {
    navigator.share(shareData).catch((err) => console.log('Error:', err));
  } else {
    navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
    alert("¡Enlace copiado al portapapeles! Ya puedes pegarlo en tus chats.");
  }
}

const policies = {
  terms: `
    <h2 class="text-xl font-bold mb-4">Términos y Condiciones</h2>
    <p class="mb-3"><b>1. Envíos y Pagos:</b> Los pedidos se procesan en 24h. El pago se realiza en efectivo al transportista al recibir el producto.</p>
    <p class="mb-3"><b>2. Garantía:</b> Cubrimos defectos de fábrica por 30 días. No cubre mal uso o daños físicos.</p>
    <p class="mb-3"><b>3. Compromiso de Compra:</b> Al realizar un pedido, el cliente se compromete a estar presente para recibir y pagar el paquete.</p>`,
  
  privacy: `
    <h2 class="text-xl font-bold mb-4">Política de Privacidad</h2>
    <p class="mb-3">En DEYXPRESS, protegemos tus datos. La información solicitada (Nombre, Celular, Dirección) se utiliza exclusivamente para la logística de entrega.</p>
    <p class="mb-3">No compartimos tus datos con terceros para fines publicitarios ajenos a nuestra tienda.</p>`
};

function openPolicy(type) {
  document.getElementById("policyText").innerHTML = policies[type];
  document.getElementById("policyModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closePolicy() {
  document.getElementById("policyModal").classList.add("hidden");
  document.body.style.overflow = "auto";
}
