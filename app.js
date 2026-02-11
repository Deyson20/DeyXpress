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
let productos = [];

// 4. FUNCIONES DE RENDERIZADO
function loadCategories() {
    if (!categoriesMenuList) return;
    const cats = ["Todos", ...new Set(productos.map(p => p.category))];
    categoriesMenuList.innerHTML = "";
    
    cats.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat;
        btn.className = "text-left px-4 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition capitalize";
        
        btn.onclick = () => {
            currentCategory = cat;
            const titleEl = document.getElementById("categoryTitle");
            const subtitleEl = document.getElementById("categorySubtitle");
            
            if (titleEl) titleEl.textContent = cat === "Todos" ? "Todos los productos" : cat;
            if (subtitleEl) {
                subtitleEl.textContent = cat === "Todos" ? "Explora nuestro catálogo completo" : `Artículos de la categoría ${cat}`;
            }
            
            showCatalog();
            renderProducts();
            if (typeof toggleCategoriesMenu === "function") toggleCategoriesMenu();
        };
        categoriesMenuList.appendChild(btn);
    });
}

function renderProducts(filterTerm = "") {
    if (!grid) return;
    const titleEl = document.getElementById("categoryTitle");
    if (filterTerm && titleEl) {
        titleEl.textContent = `Buscando: ${filterTerm}`;
    } else if (!filterTerm && titleEl) {
        titleEl.textContent = currentCategory === "Todos" ? "Todos los productos" : currentCategory;
    }
    grid.innerHTML = "";
    
    const filtered = productos
        .filter(p => (currentCategory === "Todos" || p.category === currentCategory))
        .filter(p => p.name.toLowerCase().includes(filterTerm.toLowerCase()));
    
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center"><p class="text-slate-500">No se encontraron productos.</p></div>`;
        return;
    }
    
    filtered.forEach(p => {
        const div = document.createElement("div");
        div.className = "bg-white p-4 rounded-2xl shadow hover:shadow-lg transition cursor-pointer flex flex-col";
        div.innerHTML = `
      <img src="${p.images[0]}" class="h-40 w-full object-contain mb-3">
      <h3 class="font-bold text-slate-800 text-sm mb-1 break-words" style="hyphens: auto; -webkit-hyphens: auto;">
    ${p.name}
</h3>
      <p class="font-black text-indigo-600 mt-2">${formatter.format(p.price)}</p>
      
      <div class="mt-auto space-y-2 pt-3">
        <button onclick="event.stopPropagation(); verDetalleDesdeString('${p.id}')" 
                class="border border-indigo-600 text-indigo-600 py-2 w-full rounded-xl font-bold text-xs">
                Ver Detalle
        </button>
        <button onclick="event.stopPropagation(); addToCart('${p.id}', this)" 
                class="bg-indigo-50 text-indigo-600 py-2 w-full rounded-xl font-bold text-xs border border-indigo-100 transition-all">
                Añadir al Carrito
        </button>
        <button onclick="event.stopPropagation(); comprarDirecto('${p.id}')" 
        class="bg-indigo-600 text-white py-2 w-full rounded-xl font-bold text-xs shadow-md">
        Comprar Directo
</button>
      </div>
    `;
        div.onclick = () => showProductDetail(p);
        grid.appendChild(div);
    });
}

window.verDetalleDesdeString = function(id) {
    const p = productos.find(prod => prod.id == id);
    if (p) showProductDetail(p);
}

// 5. NAVEGACIÓN DE VISTAS
function showProductDetail(product) {
    currentProduct = product;
    catalogView.classList.add("hidden");
    productDetailView.classList.remove("hidden");
    window.scrollTo(0, 0);
    
    // 1. Manejo de imágenes: Convierte texto con comas en una lista (Array)
    let imagenes = [];
    if (Array.isArray(product.images)) {
        imagenes = product.images;
    } else {
        // Si vienen de la DB como texto separado por comas
        imagenes = product.images ? product.images.split(',').map(img => img.trim()) : [];
    }
    
    const desc = product.description ? product.description.replace(/\n/g, '<br>') : 'Sin descripción';
    
    // 2. Renderizado del HTML con Galería
    detailContent.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-3xl border shadow-sm">
      <div class="flex flex-col gap-4">
        <div class="relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 h-80 flex items-center justify-center">
            <img id="mainDetailImage" src="${imagenes[0]}" class="w-full h-full object-contain p-4 transition-all duration-300">
        </div>
        
        ${imagenes.length > 1 ? `
        <div id="thumbGallery" class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            ${imagenes.map((img, index) => `
                <img src="${img}" 
                     onclick="document.getElementById('mainDetailImage').src='${img}'; updateThumbUI(this)"
                     class="thumb-item w-20 h-20 object-cover rounded-xl cursor-pointer border-2 transition-all ${index === 0 ? 'border-indigo-600' : 'border-transparent'}">
            `).join('')}
        </div>
        ` : ''}
      </div>

      <div class="text-left flex flex-col">
        <h2 class="text-xl md:text-2xl font-extrabold text-slate-800 break-words leading-tight" style="hyphens: auto; -webkit-hyphens: auto;">
    ${product.name}
</h2>
        <p class="text-indigo-600 text-3xl font-black my-4">${formatter.format(product.price)}</p>
        <div class="text-slate-500 mb-6 text-sm leading-relaxed flex-1">${desc}</div>
        <div class="space-y-3">
            <button onclick="comprarDirectoDesdeDetail()" 
                class="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition uppercase tracking-wider">
                Comprar Ahora
            </button>
            <button onclick="addToCart('${product.id}', this)" 
                class="w-full bg-white text-indigo-600 py-4 rounded-xl font-bold border-2 border-indigo-600 hover:bg-indigo-50 transition uppercase tracking-wider">
                Añadir al Carrito
            </button>
        </div>
      </div>
    </div>`;
}

// 3. FUNCIÓN AUXILIAR (Añádela justo debajo de la anterior)
window.updateThumbUI = function(selectedThumb) {
    document.querySelectorAll('.thumb-item').forEach(el => {
        el.classList.remove('border-indigo-600');
        el.classList.add('border-transparent');
    });
    selectedThumb.classList.add('border-indigo-600');
    selectedThumb.classList.remove('border-transparent');
};

function showCatalog() {
    catalogView.classList.remove("hidden");
    productDetailView.classList.add("hidden");
    orderFormView.classList.add("hidden");
    localStorage.setItem("ultima_vista_deyxpress", "catalogo");
}

// 6. LÓGICA DEL CARRITO
function updateCart() {
    localStorage.setItem("cart_deyxpress", JSON.stringify(cart));
    if (!cartItems) return;
    
     if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-slate-400">
                <i class="fas fa-shopping-basket text-4xl mb-4"></i>
                <p class="font-medium">Tu carrito está vacío</p>
                <button onclick="toggleCart()" class="mt-4 text-indigo-600 text-sm font-bold uppercase">
                    Explorar productos
                </button>
            </div>
        `;
        cartTotal.textContent = formatter.format(0);
        cartCounter.classList.add("hidden");
        return; // Detenemos la ejecución aquí porque no hay nada que listar
    }
    
    cartItems.innerHTML = "";
    let total = 0;
    let count = 0;
    
   
    
    cart.forEach((item, index) => {
        total += item.price * item.qty;
        count += item.qty;
        const div = document.createElement("div");
        div.className = "flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100";
        div.innerHTML = `
          <img src="${item.images[0]}" class="w-12 h-12 object-cover rounded-lg">
          <div class="flex-1">
            <h4 class="text-xs font-bold line-clamp-1">${item.name}</h4>
            <p class="text-indigo-600 font-black text-sm">${formatter.format(item.price)}</p>
            <div class="flex items-center gap-2 mt-1">
              <button onclick="changeQty(${index}, -1)" class="w-6 h-6 bg-white border rounded flex items-center justify-center text-xs">-</button>
              <span class="text-xs font-bold">${item.qty}</span>
              <button onclick="changeQty(${index}, 1)" class="w-6 h-6 bg-white border rounded flex items-center justify-center text-xs">+</button>
            </div>
          </div>
          <button onclick="removeFromCart(${index})" class="text-slate-300 hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
        `;
        cartItems.appendChild(div);
    });
    
    if (cartTotal) cartTotal.textContent = formatter.format(total);
    if (cartCounter) cartCounter.textContent = count;
}

window.addToCart = function(productId, btnElement = null) {
    const p = productos.find(item => item.id == productId);
    if (!p) return;
    
    const existingIndex = cart.findIndex(item => item.id == productId);
    if (existingIndex !== -1) {
        cart[existingIndex].qty++;
    } else {
        cart.push({ ...p, qty: 1 });
    }
    
    updateCart();
    
    // Feedback visual en el botón
    if (btnElement) {
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = "¡Agregado! ✅";
        btnElement.classList.add("bg-green-50", "text-green-600", "border-green-200");
        setTimeout(() => {
            btnElement.innerHTML = originalText;
            btnElement.classList.remove("bg-green-50", "text-green-600", "border-green-200");
        }, 1500);
    }
    
    // Abrir carrito automáticamente
    if (cartSidebar) cartSidebar.classList.remove("translate-x-full");
};

window.changeQty = function(index, delta) {
    if (cart[index]) {
        cart[index].qty += delta;
        if (cart[index].qty < 1) removeFromCart(index);
        else updateCart();
    }
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCart();
};

function comprarDirecto(productId) {
    const p = productos.find(item => item.id == productId);
    if (!p) return;
    cart = [{ ...p, qty: 1 }];
    updateCart();
    confirmOrder();
}

function comprarDirectoDesdeDetail() {
    if (!currentProduct) return;
    cart = [{ ...currentProduct, qty: 1 }];
    updateCart();
    confirmOrder();
}

// 7. MOTOR DB (SQLITE)
async function iniciarTiendaConDB() {
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
        });
        const response = await fetch('tienda.db');
        if (!response.ok) throw new Error("No se encontró tienda.db");
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
        if (searchInput) searchInput.addEventListener("input", (e) => renderProducts(e.target.value));
        if (searchInputMobile) searchInputMobile.addEventListener("input", (e) => renderProducts(e.target.value));
    } catch (error) { console.error("Error:", error); }
}
document.addEventListener("DOMContentLoaded", iniciarTiendaConDB);

// 8. INTERFAZ Y NAVEGACIÓN (CON HISTORIAL )
window.showProduct = function(id) {
    const p = productos.find(prod => prod.id == id);
    if (p) {
        showProductDetail(p); // Llama a tu función real
    }
};

window.toggleCart = function() {
    if (!cartSidebar) return;
    cartSidebar.classList.toggle("translate-x-full");
    if (!cartSidebar.classList.contains("translate-x-full")) {
        history.pushState({ view: history.state?.view || 'catalog', panel: 'cart' }, "");
    }
};
window.confirmOrder = function() {
    // Ocultamos catálogo y detalle, mostramos formulario
    catalogView.classList.add("hidden");
    productDetailView.classList.add("hidden");
    orderFormView.classList.remove("hidden");
    
    // Cerramos el carrito lateral si está abierto
    if (cartSidebar) cartSidebar.classList.add("translate-x-full");
    
    window.scrollTo(0, 0);
    localStorage.setItem("ultima_vista_deyxpress", "formulario");
};

window.toggleCategoriesMenu = function() {
    const menu = document.getElementById("categoriesMenu");
    if (!menu) return;
    menu.classList.toggle("hidden");
    if (!menu.classList.contains("hidden")) {
        history.pushState({ view: history.state?.view || 'catalog', panel: 'menu' }, "");
    }
};

window.closeOrderForm = function() {
    if (history.state?.view === 'order') history.back();
    else {
        orderFormView.classList.add("hidden");
        catalogView.classList.remove("hidden");
    }
};

window.onpopstate = function(event) {
    const menu = document.getElementById("categoriesMenu");
    if (menu && !menu.classList.contains("hidden")) { menu.classList.add("hidden"); return; }
    if (cartSidebar && !cartSidebar.classList.contains("translate-x-full")) { cartSidebar.classList.add("translate-x-full"); return; }
    
    if (event.state) {
        const view = event.state.view;
        if (view === 'catalog') showCatalog(false);
        else if (view === 'detail') showProductDetail(event.state.product, false);
        else if (view === 'order') confirmOrder(false);
    } else { showCatalog(false); }
};

const _originalShowProductDetail = showProductDetail;
showProductDetail = function(product, push = true) {
    _originalShowProductDetail(product);
    if (push) history.pushState({ view: 'detail', product: product }, "");
};

const _originalShowCatalog = showCatalog;
showCatalog = function(push = true) {
    _originalShowCatalog();
    if (push) history.pushState({ view: 'catalog' }, "");
};

const _originalConfirmOrder = confirmOrder;
confirmOrder = function(push = true) {
    _originalConfirmOrder();
    if (push) history.pushState({ view: 'order' }, "");
};

history.replaceState({ view: 'catalog' }, "");

// 9. WHATSAPP FORM - CON CAMPOS COMPLETOS
document.getElementById("orderForm")?.addEventListener("submit", function(e) {
    e.preventDefault();
    
    if (cart.length === 0) return alert("El carrito está vacío");
    
    // 1. Recopilar los productos del carrito
    let listaProductos = "";
    let totalPedido = 0;
    cart.forEach(item => {
        totalPedido += (item.price * item.qty);
        listaProductos += `• ${item.name} (x${item.qty})\n`;
    });
    
    // 2. Capturar los valores del formulario
    const nombre = document.getElementById("nombre").value;
    const telefono = document.getElementById("telefono").value;
    const departamento = document.getElementById("departamento").value; // Agregado
    const email = document.getElementById("email").value || "No proporcionado";
    const ciudad = document.getElementById("ciudad").value;
    const barrio = document.getElementById("barrio").value;
    const tipoRes = document.getElementById("tipoResidencia").value;
    const direccion = document.getElementById("direccion").value;
    const referencia = document.getElementById("referencia").value;
    const horario = document.getElementById("horario").value;
    const efectivo = document.getElementById("confirmacionEfectivo").value;
    
    // 3. Capturar campos de Compromiso (Nuevos)
    const dejaDinero = document.querySelector('input[name="p1"]:checked')?.value || "No especificado";
    const estaraPendiente = document.querySelector('input[name="p2"]:checked')?.value || "No especificado";
    const entiendeDevolucion = document.querySelector('input[name="p3"]:checked')?.value || "No especificado";
    
    // 4. Lógica para determinar quién recibe
    const quienRecibeOpcion = document.querySelector('input[name="quienRecibe"]:checked')?.value;
    let recibeTexto = "";
    
    if (quienRecibeOpcion === "Otra persona") {
        const nombreOtro = document.getElementById("nombreOtro").value;
        const telOtro = document.getElementById("telOtro").value;
        const emailOtro = document.getElementById("emailOtro").value || "No proporcionado";
        recibeTexto = `Otra persona: ${nombreOtro} (Tel: ${telOtro}\n• Email: ${emailOtro}`;
    } else {
        recibeTexto = "El cliente person almente";
    }
    
    // 5. Capturar días seleccionados
    const dias = Array.from(document.querySelectorAll('input[name="dias"]:checked'))
        .map(el => el.value).join(", ") || "No especificado";
    
    // 6. Construcción del mensaje final mejorado
    const mensaje = `*NUEVO PEDIDO - DEYXPRESS*
━━━━━━━━━━━━━━━━━━
👤 *DATOS CLIENTE*
• Nombre: ${nombre}
• Celular: ${telefono}
• Email: ${email}

📍 *DIRECCIÓN*
• Depto: ${departamento}
• Ciudad: ${ciudad}
• Barrio: ${barrio}
• Tipo: ${tipoRes}
• Dirección: ${direccion}
• Ref: ${referencia}

🛒 *PRODUCTOS*
${listaProductos}
💰 *TOTAL A PAGAR: ${formatter.format(totalPedido)}*

🚚 *ENTREGA*
• Recibe: ${recibeTexto}
• Días: ${dias}
• Horario: ${horario}
• ¿Dinero listo?: ${efectivo}

🤝 *COMPROMISO*
• ¿Dejará el dinero?: ${dejaDinero}
• ¿Estará pendiente?: ${estaraPendiente}
• ¿Acepta términos?: ${entiendeDevolucion}
━━━━━━━━━━━━━━━━━━`;
    
    // 7. Configurar número y abrir WhatsApp
    const fone = "573166093629";
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(mensaje)}`, '_blank');
    setTimeout(() => {
        // En lugar de borrar de una vez, preguntamos:
        const deseaLimpiar = confirm("¿Deseas vaciar el carrito y volver al inicio?");
        
        if (deseaLimpiar) {
            // 8. Limpiar el carrito y recargar
            cart = [];
            localStorage.removeItem("cart_deyxpress");
            localStorage.removeItem("datos_cliente_deyxpress");
            location.reload();
        } else {
            // Si el cliente dice que NO (porque quiere reenviar el correo de la otra persona, por ejemplo)
            // Solo lo mandamos al catálogo pero mantenemos sus productos.
            orderFormView.classList.add("hidden");
            catalogView.classList.remove("hidden");
            window.scrollTo(0, 0);
        }
    }, 1000); // Le damos 1 segundo para que WhatsApp respire
});


// --- FUNCIONES DE INTERFAZ EXTRAS ---

window.toggleMobileSearch = function() {
    const c = document.getElementById("mobileSearchContainer");
    if (c) {
        c.classList.toggle("hidden");
        if (!c.classList.contains("hidden")) document.getElementById("searchInputMobile").focus();
    }
};

window.toggleOtraPersona = function(s) {
    const f = document.getElementById("otraPersonaFields");
    if (f) {
        f.classList.toggle("hidden-section", !s);
        f.querySelectorAll('input').forEach(i => i.required = s);
    }
};

// --- FUNCIONALIDAD DEL BUSCADOR (BOTÓN LUPA Y ENTER) ---

window.ejecutarBusqueda = function() {
    // Detectamos cuál buscador tiene texto (Escritorio o Móvil)
    const term = (document.getElementById("searchInput").value ||
        document.getElementById("searchInputMobile").value || "").toLowerCase();
    
    // Ejecutamos el renderizado con el filtro
    renderProducts(term);
    
    // Si estamos en móvil y el buscador está abierto, lo cerramos
    const mobileSearchContainer = document.getElementById("mobileSearchContainer");
    if (mobileSearchContainer && !mobileSearchContainer.classList.contains("hidden")) {
        toggleMobileSearch();
    }
    
    // Scroll suave hacia arriba para ver los resultados
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Configurar tecla "Enter" en ambos buscadores
[document.getElementById("searchInput"), document.getElementById("searchInputMobile")].forEach(input => {
    input?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            window.ejecutarBusqueda();
        }
    });
});

// --- FUNCIÓN PARA COMPARTIR PRODUCTO ---
window.compartirProducto = function() {
    if (!currentProduct) return;
    
    // Creamos una URL especial que incluye el ID del producto
    // Esto genera algo como: misitio.com/index.html?id=123
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${currentProduct.id}`;
    
    if (navigator.share) {
        navigator.share({
                title: currentProduct.name,
                text: `Mira este producto en DEYXPRESS: ${currentProduct.name}`,
                url: shareUrl // <--- Enviamos la URL con el ID
            })
            .catch((error) => console.log('Error al compartir', error));
    } else {
        navigator.clipboard.writeText(shareUrl);
        alert("¡Enlace del producto copiado!");
    }
};


// --- MODIFICACIÓN EN LA FUNCIÓN QUE MUESTRA EL DETALLE ---
// Busca tu función showProduct(id) y asegúrate de que actualice el meta-image
const originalShowProduct = window.showProduct;
window.showProduct = function(id) {
    // Buscamos el producto
    const p = productos.find(x => x.id == id);
    if (p) {
        // Cambiamos la imagen de la metaetiqueta inmediatamente
        document.getElementById('meta-image').setAttribute('content', p.images[0]);
        document.getElementById('meta-title').setAttribute('content', p.name);
    }
    
    // Llamamos a la función original que ya tenías
    if (typeof originalShowProduct === "function") {
        originalShowProduct(id);
    }
};


// --- LÓGICA PARA ABRIR PRODUCTO DESDE LINK ---
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        const checkProducts = setInterval(() => {
            if (typeof productos !== 'undefined' && productos.length > 0) {
                // Buscamos el producto con ==
                const existe = productos.find(p => p.id == productId);
                if (existe) {
                    showProductDetail(existe);
                    // Actualizamos meta tags visuales para el usuario
                    if (document.getElementById('meta-image'))
                        document.getElementById('meta-image').src = existe.images[0];
                    
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
                clearInterval(checkProducts);
            }
        }, 100);
        setTimeout(() => clearInterval(checkProducts), 5000);
    }
});


// --- FUNCIÓN PARA COMPARTIR ---
window.shareProduct = function(id) {
    const p = productos.find(x => x.id == id);
    if (!p) return;
    
    // Generamos la URL con el ID del producto
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;
    
    if (navigator.share) {
        navigator.share({
            title: p.name,
            text: `Mira este producto en DEYXPRESS: ${p.name}`,
            url: shareUrl
        }).catch((error) => console.log('Error al compartir', error));
    } else {
        // Opción para computadoras o navegadores sin "Compartir" nativo
        navigator.clipboard.writeText(shareUrl);
        alert("¡Enlace del producto copiado al portapapeles!");
    }
};

// --- SISTEMA DE PERSISTENCIA TOTAL DEY XPRESS ---

const guardarProgresoFormulario = () => {
    const datosDeyxpress = {
        // Campos de texto y selects
        nombre: document.getElementById("nombre")?.value,
        telefono: document.getElementById("telefono")?.value,
        departamento: document.getElementById("departamento")?.value,
        email: document.getElementById("email")?.value,
        ciudad: document.getElementById("ciudad")?.value,
        barrio: document.getElementById("barrio")?.value,
        tipoResidencia: document.getElementById("tipoResidencia")?.value,
        direccion: document.getElementById("direccion")?.value,
        referencia: document.getElementById("referencia")?.value,
        horario: document.getElementById("horario")?.value,
        confirmacionEfectivo: document.getElementById("confirmacionEfectivo")?.value,
        nombreOtro: document.getElementById("nombreOtro")?.value,
        telOtro: document.getElementById("telOtro")?.value,
        emailOtro: document.getElementById("emailOtro")?.value,
        
        // Radio buttons (quién recibe y compromiso)
        quienRecibe: document.querySelector('input[name="quienRecibe"]:checked')?.value,
        p1: document.querySelector('input[name="p1"]:checked')?.value,
        p2: document.querySelector('input[name="p2"]:checked')?.value,
        p3: document.querySelector('input[name="p3"]:checked')?.value,
        
        // Checkboxes (días)
        dias: Array.from(document.querySelectorAll('input[name="dias"]:checked')).map(el => el.value)
    };
    localStorage.setItem("datos_cliente_deyxpress", JSON.stringify(datosDeyxpress));
};

// Escuchar cambios en cualquier parte del formulario
document.addEventListener("change", guardarProgresoFormulario);
document.addEventListener("input", guardarProgresoFormulario);

// Función para restaurar todo al cargar la página
function restaurarFormulario() {
    const data = JSON.parse(localStorage.getItem("datos_cliente_deyxpress"));
    if (!data) return;
    
    // Restaurar textos y selects
    const campos = ["nombre", "telefono", "departamento", "email", "ciudad", "barrio",
        "tipoResidencia", "direccion", "referencia", "horario",
        "confirmacionEfectivo", "nombreOtro", "telOtro", "emailOtro"
    ];
    
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el && data[id]) el.value = data[id];
    });
    
    // Restaurar Radio Buttons
    const radios = ["quienRecibe", "p1", "p2", "p3"];
    radios.forEach(name => {
        if (data[name]) {
            const radio = document.querySelector(`input[name="${name}"][value="${data[name]}"]`);
            if (radio) radio.checked = true;
        }
    });
    
    // Restaurar Checkboxes (Días)
    if (data.dias) {
        data.dias.forEach(valor => {
            const check = document.querySelector(`input[name="dias"][value="${valor}"]`);
            if (check) check.checked = true;
        });
    }
    
    // Disparar lógica visual (por si "Otra persona" estaba marcado)
    if (data.quienRecibe === "Otra persona") {
        document.getElementById("camposOtraPersona")?.classList.remove("hidden");
    }
}

// Ejecutar al cargar la web
// --- EVENTO PRINCIPAL DE CARGA ---
window.addEventListener("DOMContentLoaded", () => {
    // 1. Restauramos los textos y selecciones del formulario
    restaurarFormulario();
    
    // 2. Revisamos en qué vista se quedó el cliente
    const ultimaVista = localStorage.getItem("ultima_vista_deyxpress");
    
    // 3. Lógica de redirección automática
    if (ultimaVista === "formulario" && cart.length > 0) {
        // Si el cliente estaba llenando el pago y tiene productos, lo llevamos allá
        if (typeof window.confirmOrder === 'function') {
            window.confirmOrder();
        }
    } else {
        // Si no, aseguramos que vea el catálogo
        if (typeof window.showCatalog === 'function') {
            window.showCatalog();
        }
    }
});