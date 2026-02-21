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

// --- CONFIGURACIÓN CLOUDFLARE D1 ---
const API_URL = "PON_AQUI_TU_URL_DEL_WORKER"; // Ej: https://tienda-api.deyxpress.workers.dev

let cart = JSON.parse(localStorage.getItem("cart_deyxpress")) || [];
let currentProduct = null;
let currentCategory = "Todos";
let selectedVariant = null; // Variable para guardar la opción elegida
let productos = [];
let scrollPosition = 0; // Esta variable recordará dónde estabas

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
      <img src="${p.images[0]}" 
     onerror="handleCatalogError(this)" 
     class="h-40 w-full object-contain mb-3">
      <h3 class="font-bold text-slate-800 text-sm mb-1 break-words" style="hyphens: auto; -webkit-hyphens: auto;">
    ${p.name}
</h3>
      ${p.freeShipping === "true" ? '<span class="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded w-fit mb-1">ENVÍO GRATIS</span>' : ''}
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

        // Verificamos si alguna de las imágenes (no solo la primera) está rota
        checkProductImages(p, div);
    });
}

// Función para validar todas las imágenes de un producto en el catálogo
function checkProductImages(product, cardElement) {
    if (!product.images || !Array.isArray(product.images)) return;
    
    product.images.forEach(url => {
        const img = new Image();
        img.src = url;
        img.onerror = () => {
            const mainImg = cardElement.querySelector('img');
            // Si falla alguna imagen y aún no está marcado como agotado, lo marcamos
            if (mainImg && !mainImg.src.includes('text=PRODUCTO+AGOTADO')) {
                handleCatalogError(mainImg);
            }
        };
    });
}

window.verDetalleDesdeString = function (id) {
    const p = productos.find(prod => prod.id == id);
    if (p) showProductDetail(p);
}

// Helper para convertir URL de YouTube a formato de inserción (embed)
function getYoutubeEmbedUrl(url) {
    if (!url || typeof url !== 'string') return null;
    let videoId = null;
    try {
        if (url.includes("youtube.com/watch")) {
            const urlParams = new URLSearchParams(new URL(url).search);
            videoId = urlParams.get("v");
        } else if (url.includes("youtube.com/shorts/")) {
            videoId = url.split("shorts/")[1].split("?")[0];
        } else if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1].split("?")[0];
        }
    } catch (e) {
        console.error("URL de video no válida:", url, e);
        return null;
    }
    // Parámetros agregados:
    // rel=0: Al terminar, solo muestra videos TUYOS (no de la competencia).
    // modestbranding=1: Oculta el logo grande de YouTube.
    // iv_load_policy=3: Oculta anotaciones y popups molestos.
    // controls=1: Mantiene los controles de pausa/play.
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&controls=1` : null;
}

// 5. NAVEGACIÓN DE VISTAS
function showProductDetail(product) {
    scrollPosition = window.scrollY;
    currentProduct = product;
    selectedVariant = null; // Obligar al cliente a seleccionar manualmente
    
    // --- ACTUALIZAR META TAGS PARA COMPARTIR ---
    if (product) {
        // 1. Título de la pestaña del navegador
        document.title = `${product.name} | DEYXPRESS`;

        // 2. Metaetiquetas Open Graph (Para WhatsApp, Facebook, etc.)
        const metaImg = document.getElementById('meta-image');
        const metaTitle = document.getElementById('meta-title');
        const metaDesc = document.getElementById('meta-desc');
        
        if (metaImg && product.images && product.images.length > 0) metaImg.setAttribute('content', product.images[0]);
        if (metaTitle) metaTitle.setAttribute('content', product.name);
        if (metaDesc) {
            // Creamos un elemento temporal para limpiar el HTML de la descripción
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = product.description || '';
            const cleanDesc = tempDiv.textContent || tempDiv.innerText || '';
            // Acortamos la descripción a un tamaño ideal para vistas previas
            const truncatedDesc = cleanDesc.substring(0, 155) + (cleanDesc.length > 155 ? '...' : '');
            metaDesc.setAttribute('content', truncatedDesc || `Encuentra ${product.name} y más en DEYXPRESS.`);
        }
    }

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

    const desc = product.description || 'Sin descripción';
    const embedUrl = getYoutubeEmbedUrl(product.video);
    const videoHtml = embedUrl ? `
        <div class="mt-4 w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black">
            <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
    ` : '';


    // 2. Renderizado del HTML con Galería
    detailContent.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-3xl border shadow-sm">
      <div class="flex flex-col gap-4">
        <div class="relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 h-80 flex items-center justify-center">
            <img id="mainDetailImage" src="${imagenes[0]}" 
     onerror="handleDetailError(this)" 
     class="w-full h-full object-contain p-4 transition-all duration-300">
        </div>
        
        ${imagenes.length > 1 ? `
        <div id="thumbGallery" class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            ${imagenes.map((img, index) => `
                <img src="${img}" 
                onerror="handleDetailError(this)"
                     onclick="document.getElementById('mainDetailImage').src='${img}'; updateThumbUI(this)"
                     class="thumb-item w-20 h-20 object-cover rounded-xl cursor-pointer border-2 transition-all ${index === 0 ? 'border-indigo-600' : 'border-transparent'}">
            `).join('')}
        </div>
        ` : ''}
        ${videoHtml}
      </div>

      <div class="text-left flex flex-col">
        <h2 class="text-xl md:text-2xl font-extrabold text-slate-800 break-words leading-tight" style="hyphens: auto; -webkit-hyphens: auto;">
    ${product.name}
</h2>
        ${product.freeShipping === "true" ? '<span class="bg-green-100 text-green-700 text-xs font-black px-3 py-1 rounded-full w-fit mt-2">🚀 ENVÍO GRATIS</span>' : ''}
        <p class="text-indigo-600 text-3xl font-black my-4">${formatter.format(product.price)}</p>
        <div class="text-slate-500 mb-6 text-sm leading-relaxed flex-1">${desc}</div>
        
        ${product.variants && product.variants.length > 0 ? `
        <div class="mb-6">
            <p class="text-sm font-bold text-slate-800 mb-2">Opciones disponibles:</p>
            <div class="flex flex-wrap gap-2">
                ${product.variants.map((v, i) => `
                    <button onclick="selectVariant('${v}', this)" 
                        class="variant-btn px-4 py-2 rounded-lg border text-sm font-medium transition-all border-slate-200 text-slate-600 hover:border-indigo-300">
                        ${v}
                    </button>
                `).join('')}
            </div>
        </div>` : ''}

        <div class="space-y-3">
            <button onclick="comprarDirectoDesdeDetail()" 
                class="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition uppercase tracking-wider">
                Comprar Ahora
            </button>
            <button onclick="addToCartFromDetail(this)" 
                class="w-full bg-white text-indigo-600 py-4 rounded-xl font-bold border-2 border-indigo-600 hover:bg-indigo-50 transition uppercase tracking-wider">
                Añadir al Carrito
            </button>
        </div>
      </div>
    </div>`;
}

// --- MANEJO DE ERRORES DE IMAGEN Y BLOQUEO DE BOTONES ---

window.handleCatalogError = function(img) {
    // 1. Poner imagen de Agotado
    img.src = 'https://placehold.co/600x600/e2e8f0/64748b?text=PRODUCTO+AGOTADO';
    img.onerror = null; // Evitar bucle infinito

    // 2. Buscar la tarjeta del producto y deshabilitar botones
    const card = img.closest('.bg-white');
    if (card) {
        const btns = card.querySelectorAll('button');
        btns.forEach(btn => {
            const text = btn.innerText.toLowerCase();
            // Bloqueamos solo los botones de acción de compra
            if (text.includes('comprar') || text.includes('añadir')) {
                btn.disabled = true;
                // Reemplazamos clases para asegurar estilo gris uniforme y sin conflictos
                btn.className = "py-2 w-full rounded-xl font-bold text-xs bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed";
                btn.innerText = "No disponible";
                btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); };
            }
        });
    }
};

window.handleDetailError = function(img) {
    img.src = 'https://placehold.co/600x600/e2e8f0/64748b?text=PRODUCTO+AGOTADO';
    img.onerror = null;

    // Si falla cualquier imagen (incluso una miniatura), forzamos la imagen principal a AGOTADO
    const mainImg = document.getElementById('mainDetailImage');
    if (mainImg) {
        mainImg.src = 'https://placehold.co/600x600/e2e8f0/64748b?text=PRODUCTO+AGOTADO';
    }

    // En la vista de detalle, buscamos los botones dentro del contenedor principal
    const container = document.getElementById('detailContent');
    if (container) {
        const btns = container.querySelectorAll('button');
        btns.forEach(btn => {
            const text = btn.innerText.toLowerCase();
            if (text.includes('comprar') || text.includes('añadir')) {
                btn.disabled = true;
                // Reemplazamos clases para asegurar estilo gris uniforme (manteniendo tamaño grande)
                btn.className = "w-full py-4 rounded-xl font-bold bg-slate-100 text-slate-400 border-2 border-slate-200 cursor-not-allowed uppercase tracking-wider";
                btn.innerText = "No disponible";
                btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); };
            }
        });
    }
};

// 3. FUNCIÓN AUXILIAR (Añádela justo debajo de la anterior)
window.updateThumbUI = function (selectedThumb) {
    document.querySelectorAll('.thumb-item').forEach(el => {
        el.classList.remove('border-indigo-600');
        el.classList.add('border-transparent');
    });
    selectedThumb.classList.add('border-indigo-600');
    selectedThumb.classList.remove('border-transparent');
};

// 4. FUNCIONES PARA VARIANTES
window.selectVariant = function(val, btn) {
    selectedVariant = val;
    document.querySelectorAll('.variant-btn').forEach(b => {
        b.className = "variant-btn px-4 py-2 rounded-lg border text-sm font-medium transition-all border-slate-200 text-slate-600 hover:border-indigo-300";
    });
    btn.className = "variant-btn px-4 py-2 rounded-lg border text-sm font-medium transition-all border-indigo-600 bg-indigo-50 text-indigo-700";
};

window.addToCartFromDetail = function(btnElement) {
    if (!currentProduct) return;
    
    // Validar si tiene variantes y no ha seleccionado ninguna
    if (currentProduct.variants && currentProduct.variants.length > 0 && !selectedVariant) {
        alert("⚠️ Por favor, selecciona una opción (Color, Talla, etc.) antes de agregar al carrito.");
        return;
    }

    // Pasamos la variante seleccionada a la función principal
    addToCart(currentProduct.id, btnElement, selectedVariant);
};

function showCatalog() {
    catalogView.classList.remove("hidden");
    productDetailView.classList.add("hidden");
    orderFormView.classList.add("hidden");
    localStorage.setItem("ultima_vista_deyxpress", "catalogo");
    setTimeout(() => {
        window.scrollTo({
            top: scrollPosition,
            behavior: 'instant'
        });
    }, 10); // Usamos un pequeño retraso para asegurar que la vista ya es visible
}

// 6. LÓGICA DEL CARRITO
function updateCart() {
    localStorage.setItem("cart_deyxpress", JSON.stringify(cart));
    if (!cartItems) return;
    const btnCheckout = document.getElementById("btnCheckout");

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
        if (document.getElementById("cartSubtotal")) document.getElementById("cartSubtotal").textContent = formatter.format(0);
        if (document.getElementById("cartShipping")) document.getElementById("cartShipping").textContent = formatter.format(0);
        cartCounter.classList.add("hidden");
        if (btnCheckout) btnCheckout.disabled = true;

        // Si estamos en el formulario y el carrito se vacía, regresar al catálogo automáticamente
        if (!orderFormView.classList.contains("hidden")) {
            showCatalog();
        }

        return; // Detenemos la ejecución aquí porque no hay nada que listar
    }

    if (btnCheckout) btnCheckout.disabled = false;
    cartItems.innerHTML = "";
    let subtotal = 0;
    let count = 0;
    const bodegasUnicas = new Set(); // Detecta bodegas sin repetir



    cart.forEach((item, index) => {
        subtotal += item.price * item.qty;
        // Solo cobramos flete si el producto NO tiene envío gratis
        if (item.freeShipping !== "true") {
            bodegasUnicas.add(item.origin || "Nacional");
        }
        count += item.qty;

        // Lógica para mostrar flete individual
        let shippingDisplay = "";
        if (item.freeShipping === "true") {
            shippingDisplay = `<span class="text-green-600 text-[10px] font-bold bg-green-50 px-2 py-0.5 rounded">🚀 Envío Gratis</span>`;
        } else {
            const tarifa = obtenerTarifaPorOrigen(item.origin || "Nacional");
            shippingDisplay = `<span class="text-slate-500 text-[10px] font-medium">Flete: ${formatter.format(tarifa)}</span>`;
        }

        const div = document.createElement("div");
        div.className = "flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100";
        div.innerHTML = `
          <img src="${item.images[0]}" onerror="this.src='https://placehold.co/100x100/e2e8f0/64748b?text=AGOTADO'; this.onerror=null;" class="w-12 h-12 object-cover rounded-lg">
          <div class="flex-1">
            <h4 class="text-xs font-bold line-clamp-1">${item.name}</h4>
            ${item.variant ? `<p class="text-[10px] text-slate-500 bg-slate-100 inline-block px-1 rounded mt-0.5">Opción: ${item.variant}</p>` : ''}
            <div class="flex flex-col mt-0.5">
                <p class="text-indigo-600 font-black text-sm">${formatter.format(item.price)}</p>
                ${shippingDisplay}
            </div>
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
    
    // Calculamos el flete sumando el costo individual de cada bodega detectada
    let totalFlete = 0;
    bodegasUnicas.forEach(origen => totalFlete += obtenerTarifaPorOrigen(origen));
    
    const granTotal = subtotal + totalFlete;

    // Actualizar Subtotal y Envío
    if (document.getElementById("cartSubtotal")) document.getElementById("cartSubtotal").textContent = formatter.format(subtotal);
    if (document.getElementById("cartShipping")) document.getElementById("cartShipping").textContent = formatter.format(totalFlete);

    if (cartTotal) cartTotal.textContent = formatter.format(granTotal);
    if (cartCounter) {
        cartCounter.textContent = count;
        cartCounter.classList.remove("hidden");
    }
    
    // Actualizar también el texto del botón de confirmar si es visible
    const btnConfirmar = document.querySelector("#orderForm button[type='submit']");
    if(btnConfirmar) btnConfirmar.innerHTML = `<i class="fab fa-whatsapp text-2xl"></i> PEDIR POR WHATSAPP (${formatter.format(granTotal)})`;
}

// Función inteligente para calcular tarifa según Origen vs Destino
function obtenerTarifaPorOrigen(origenBodega) {
    const depto = document.getElementById("departamento")?.value;
    
    // 1. ZONA ESPECIAL (Prioridad Alta: siempre cobra caro a estos destinos)
    const zonaEspecial = ["Amazonas", "San Andrés y Providencia", "Chocó", "Putumayo", "Guainía", "Vaupés", "Vichada", "Arauca", "Caquetá", "Guaviare", "La Guajira"];
    if (zonaEspecial.includes(depto)) return 25000;

    // 2. ENVÍO REGIONAL (Si el departamento de la bodega es el mismo que el del cliente)
    if (origenBodega && origenBodega !== "Nacional" && depto) {
        if (origenBodega === depto) {
            return 10000; // Tarifa Regional (Más económica)
        }
    }

    // 3. ENVÍO NACIONAL ESTÁNDAR
    return 12500; 
}

window.addToCart = function (productId, btnElement = null, variant = null) {
    const p = productos.find(item => item.id == productId);
    if (!p) return;

    // --- AVISO DE BODEGAS DIFERENTES ---
    if (cart.length > 0) {
        const bodegasEnCarrito = new Set(cart.map(item => item.origin || "Nacional"));
        const nuevaBodega = p.origin || "Nacional";

        // Si la nueva bodega no está ya en el carrito, avisamos.
        if (!bodegasEnCarrito.has(nuevaBodega)) {
            const continuar = confirm(
                "⚠️ ¡Atención! Estás agregando un producto de una bodega diferente.\n\n" +
                "Esto generará un costo de envío adicional por cada bodega distinta.\n\n" +
                "¿Deseas continuar y agregarlo al carrito?"
            );
            // Si el usuario presiona "Cancelar", detenemos todo.
            if (!continuar) {
                return; 
            }
        }
    }

    const existingIndex = cart.findIndex(item => item.id == productId && item.variant == variant);
    if (existingIndex !== -1) {
        cart[existingIndex].qty++;
    } else {
        cart.push({ ...p, qty: 1, variant: variant });
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

window.changeQty = function (index, delta) {
    if (cart[index]) {
        cart[index].qty += delta;
        if (cart[index].qty < 1) removeFromCart(index);
        else updateCart();
    }
};

window.removeFromCart = function (index) {
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

    // Validar si tiene variantes y no ha seleccionado ninguna
    if (currentProduct.variants && currentProduct.variants.length > 0 && !selectedVariant) {
        alert("⚠️ Por favor, selecciona una opción (Color, Talla, etc.) para continuar.");
        return;
    }

    cart = [{ ...currentProduct, qty: 1, variant: selectedVariant }];
    updateCart();
    confirmOrder();
}

// 7. MOTOR DB (CLOUDFLARE D1)
async function iniciarTiendaD1() {
    try {
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) throw new Error("Error conectando con la nube");
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
            productos = data.map(fila => {
                let obj = { ...fila };
                // Parsear columnas que vienen como JSON string
                ['images', 'variants'].forEach(col => {
                    if (col === 'images' || col === 'variants') {
                        const val = fila[col];
                        try { 
                            // Intentamos leer como formato JSON
                            const parsed = JSON.parse(val);
                            obj[col] = Array.isArray(parsed) ? parsed : [parsed];
                        } catch (e) { 
                            // Si falla, intentamos leer como texto separado por comas
                            obj[col] = (typeof val === 'string' && val.trim().length > 0) 
                                ? val.split(',').map(s => s.trim()) 
                                : [];
                        }
                    }
                });
                return obj;
            });
        }
    } catch (error) { 
        console.error("❌ Error cargando productos de la nube:", error);
        // Si falla la carga, dejamos la lista vacía para no mostrar datos falsos
        productos = [];
    } finally {
        loadCategories();
        renderProducts();
        updateCart();
        if (searchInput) searchInput.addEventListener("input", (e) => renderProducts(e.target.value));
        if (searchInputMobile) searchInputMobile.addEventListener("input", (e) => renderProducts(e.target.value));
    }
}
document.addEventListener("DOMContentLoaded", iniciarTiendaD1);

// 8. INTERFAZ Y NAVEGACIÓN (CON HISTORIAL )
window.showProduct = function (id) {
    const p = productos.find(prod => prod.id == id);
    if (p) {
        showProductDetail(p); // Llama a tu función real
    }
};

window.toggleCart = function () {
    if (!cartSidebar) return;
    cartSidebar.classList.toggle("translate-x-full");
    if (!cartSidebar.classList.contains("translate-x-full")) {
        history.pushState({ view: history.state?.view || 'catalog', panel: 'cart' }, "");
    }
};
window.confirmOrder = function () {
    // Ocultamos catálogo y detalle, mostramos formulario
    catalogView.classList.add("hidden");
    productDetailView.classList.add("hidden");
    orderFormView.classList.remove("hidden");

    // Cerramos el carrito lateral si está abierto
    if (cartSidebar) cartSidebar.classList.add("translate-x-full");

    window.scrollTo(0, 0);
    localStorage.setItem("ultima_vista_deyxpress", "formulario");
};

window.toggleCategoriesMenu = function () {
    const menu = document.getElementById("categoriesMenu");
    if (!menu) return;
    menu.classList.toggle("hidden");
    if (!menu.classList.contains("hidden")) {
        history.pushState({ view: history.state?.view || 'catalog', panel: 'menu' }, "");
    }
};

window.closeOrderForm = function () {
    if (history.state?.view === 'order') history.back();
    else {
        orderFormView.classList.add("hidden");
        catalogView.classList.remove("hidden");
    }
};

window.onpopstate = function (event) {
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
showProductDetail = function (product, push = true) {
    _originalShowProductDetail(product);
    if (push) {
        const newUrl = `?id=${product.id}`;
        history.pushState({ view: 'detail', product: product }, "", newUrl);
    }
};

const _originalShowCatalog = showCatalog;
showCatalog = function (push = true) {
    _originalShowCatalog();
    if (push) history.pushState({ view: 'catalog' }, "", window.location.pathname);
};

const _originalConfirmOrder = confirmOrder;
confirmOrder = function (push = true) {
    _originalConfirmOrder();
    if (push) history.pushState({ view: 'order' }, "", window.location.pathname);
};

history.replaceState({ view: 'catalog' }, "");

// 9. WHATSAPP FORM - CON CAMPOS COMPLETOS
document.getElementById("orderForm")?.addEventListener("submit", function (e) {
    e.preventDefault();

    if (cart.length === 0) return alert("El carrito está vacío");

    // 1. Recopilar los productos del carrito
    let listaProductos = "";
    let totalPedido = 0;
    cart.forEach(item => {
        totalPedido += (item.price * item.qty);
        listaProductos += `• ${item.name} ${item.variant ? `(${item.variant})` : ''} (x${item.qty})\n`;
    });

    // 2. Capturar los valores del formulario
    // ... (Aquí capturas todas tus variables: nombre, ciudad, barrio, compromiso, etc.)



    const bodegasDetectadas = [...new Set(cart.map(p => p.origin || "Nacional"))];
    let fleteFinal = 0;
    bodegasDetectadas.forEach(origen => fleteFinal += obtenerTarifaPorOrigen(origen));
    
    const subtotalProductos = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalConFlete = subtotalProductos + fleteFinal;

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
        recibeTexto = "El cliente personalmente";
    }

    // 5. Capturar días seleccionados
    const dias = Array.from(document.querySelectorAll('input[name="dias"]:checked'))
        .map(el => el.value).join(", ") || "No especificado";

    // 5. ENVIAR A GOOGLE SHEETS (Respaldo)
    const infoParaSheets = {
        nombre, telefono, departamento, email, ciudad, barrio,
        tipoRes, direccion, referencia, horario, efectivo,
        dejaDinero, estaraPendiente, entiendeDevolucion, recibeTexto, dias,
        productos: cart.map(item => `${item.name} ${item.variant ? `(${item.variant})` : ''} (x${item.qty})`).join(", "),
        total: totalPedido
    };

    // Llamada segura a la función del otro archivo
    if (typeof enviarAGoogleSheets === 'function') {
        enviarAGoogleSheets(infoParaSheets);
    }


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
💰 *TOTAL A PAGAR: ${formatter.format(totalConFlete)}*

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
    }, 2000); // Le damos 2 segundo para que WhatsApp respire
});


// --- FUNCIONES DE INTERFAZ EXTRAS ---

window.toggleMobileSearch = function () {
    const c = document.getElementById("mobileSearchContainer");
    if (c) {
        c.classList.toggle("hidden");
        if (!c.classList.contains("hidden")) document.getElementById("searchInputMobile").focus();
    }
};

window.toggleOtraPersona = function (s) {
    const f = document.getElementById("otraPersonaFields");
    if (f) {
        f.classList.toggle("hidden-section", !s);
        f.querySelectorAll('input').forEach(i => i.required = s);
    }
};

// --- FUNCIONALIDAD DEL BUSCADOR (BOTÓN LUPA Y ENTER) ---

window.ejecutarBusqueda = function () {
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
window.compartirProducto = async function () {
    if (!currentProduct) return;

    // Creamos una URL especial que incluye el ID del producto
    // Esto genera algo como: misitio.com/index.html?id=123
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${currentProduct.id}`;
    const shareText = `Mira este producto en DEYXPRESS: ${currentProduct.name} - ${formatter.format(currentProduct.price)}`;

    // INTENTO 1: Compartir IMAGEN + TEXTO (Mejor experiencia en móviles)
    if (navigator.share && navigator.canShare) {
        try {
            if (currentProduct.images && currentProduct.images.length > 0) {
                const imgUrl = currentProduct.images[0];
                // Intentamos descargar la imagen para enviarla como archivo real
                const response = await fetch(imgUrl);
                const blob = await response.blob();
                const file = new File([blob], "producto.jpg", { type: blob.type });
                
                const dataConArchivo = { title: currentProduct.name, text: shareText + "\n" + shareUrl, files: [file] };
                if (navigator.canShare(dataConArchivo)) {
                    await navigator.share(dataConArchivo);
                    return; // ¡Éxito! Se compartió la imagen real
                }
            }
        } catch (e) { console.warn("Fallback a solo link (CORS o no soportado)", e); }
    }

    // INTENTO 2: Fallback estándar (Solo link) si falla lo anterior
    if (navigator.share) {
        navigator.share({ title: currentProduct.name, text: shareText, url: shareUrl })
            .catch((error) => console.log('Error al compartir', error));
    } else {
        navigator.clipboard.writeText(shareUrl);
        alert("¡Enlace del producto copiado!");
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
                    showProductDetail(existe, false);
                    window.history.replaceState({ view: 'detail', product: existe }, document.title, window.location.href);
                }
                clearInterval(checkProducts);
            }
        }, 100);
        setTimeout(() => clearInterval(checkProducts), 5000);
    }
});

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
        if (typeof toggleOtraPersona === 'function') toggleOtraPersona(true);
    }
}

// Ejecutar al cargar la web
// --- EVENTO PRINCIPAL DE CARGA ---
window.addEventListener("DOMContentLoaded", () => {
    // 1. Restauramos los textos y selecciones del formulario
    restaurarFormulario();

    // 2. Verificar si hay un ID en la URL (Link compartido)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('id')) {
        return; // Detenemos aquí para no sobreescribir la URL con showCatalog()
    }

    // 3. Revisamos en qué vista se quedó el cliente
    const ultimaVista = localStorage.getItem("ultima_vista_deyxpress");

    // 4. Lógica de redirección automática
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