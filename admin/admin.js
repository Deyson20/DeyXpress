const API = "/api/productos";

let productos = [];
let productoEditando = null;

// ==========================
// EDITOR QUILL
// ==========================

const toolbarOptions = [
    
    [{ header: [1, 2, 3, false] }],
    
    [
        "bold",
        "italic",
        "underline",
        "strike"
    ],
    
    [
        { color: [] },
        { background: [] }
    ],
    
    [
        { align: [] }
    ],
    
    [
        { list: "ordered" },
        { list: "bullet" }
    ],
    
    [
        "blockquote",
        "code-block"
    ],
    
    [
        "link"
    ],
    
    [
        "image"
    ],
    
    [
        "video"
    ],
    
    [
        "clean"
    ]
    
];

const quill = new Quill("#editor", {
    
    theme: "snow",
    
    placeholder: "Describe tu producto...",
    
    modules: {
        
        toolbar: {
            
            container: toolbarOptions,
            
            handlers: {
                
                image: insertarImagen,
                
                video: insertarVideo
                
            }
            
        }
        
    }
    
});

function insertarImagen() {
    
    const url = prompt("URL de la imagen");
    
    if (!url) return;
    
    const range = quill.getSelection(true);
    
    quill.insertEmbed(
        
        range.index,
        
        "image",
        
        url
        
    );
    
}

function insertarVideo() {
    
    let url = prompt("Pega el enlace de YouTube");
    
    if (!url) return;
    
    let id = "";
    
    if (url.includes("watch?v="))
        
        id = url.split("watch?v=")[1].split("&")[0];
    
    else if (url.includes("youtu.be/"))
        
        id = url.split("youtu.be/")[1].split("?")[0];
    
    else {
        
        alert("URL inválida");
        
        return;
        
    }
    
    const embed =
        
        `https://www.youtube.com/embed/${id}`;
    
    const range = quill.getSelection(true);
    
    quill.insertEmbed(
        
        range.index,
        
        "video",
        
        embed
        
    );
    
}

// ==========================
// CARGAR PRODUCTOS
// ==========================
async function cargarProductos() {
    
    const res = await fetch(API);
    productos = await res.json();
    
    actualizarEstadisticas();
    renderLista(productos);
    
}

// ==========================
// ESTADÍSTICAS
// ==========================
function actualizarEstadisticas() {
    
    document.getElementById("totalProductos").textContent =
        productos.length;
    
    const categorias = [...new Set(productos.map(p => p.category))];
    
    document.getElementById("totalCategorias").textContent =
        categorias.length;
    
    let promedio = 0;
    
    if (productos.length) {
        
        promedio =
            productos.reduce((a, b) => a + Number(b.price), 0) /
            productos.length;
        
    }
    
    document.getElementById("precioPromedio").textContent =
        "$" + Math.round(promedio).toLocaleString();
    
}

// ==========================
// RENDER
// ==========================
// PEGA ESTO EXACTAMENTE AQUÍ:
function renderLista(listaProductos) {
    const lista = document.getElementById("lista");

    if (!listaProductos.length) {
        lista.innerHTML = `
        <div class="bg-white rounded-xl shadow p-10 text-center text-gray-500">
            No hay productos registrados.
        </div>
        `;
        return;
    }

    lista.innerHTML = listaProductos.map(p => {
        let imagenUrl = "";
        if (p.images) {
            imagenUrl = p.images.split(',')[0].replace('[', '').replace(']', '').replace(/"/g, '').trim();
        }
        
        // Si no tiene imagen asignada en la base de datos, forzamos un string cualquiera para que salte el onerror
        if (!imagenUrl) {
            imagenUrl = "sin-foto";
        }

        return `
        <div class="bg-white rounded-2xl shadow p-5 mb-4 border border-slate-100">
            <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div class="flex gap-4 items-center">
                    <img src="${imagenUrl}" 
                         onerror="this.src='https://placehold.co/600x600/e2e8f0/64748b?text=PRODUCTO+AGOTADO'; this.onerror=null;"
                         class="w-20 h-20 rounded-xl object-cover border flex-shrink-0" 
                         alt="${p.name}">
                    <div>
                        <h2 class="font-bold text-base sm:text-lg text-slate-800 leading-tight">${p.name}</h2>
                        <p class="text-slate-500 text-sm font-semibold mb-1">${p.category}</p>
                        
                        <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400 mb-1">
                            <span class="flex items-center gap-1">
                                📦 ${p.bodegaName || 'Sin Bodega'}
                            </span>
                            <span class="flex items-center gap-1">
                                📍 ${p.origin || 'Sin Origen'}
                            </span>
                        </div>

                        <p class="font-black text-indigo-600">$${Number(p.price).toLocaleString()}</p>
                    </div>
                </div>
                <div class="flex gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                    <button onclick="editarProducto('${p.id}')" class="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                        Editar
                    </button>
                    <button onclick="eliminarProducto('${p.id}')" class="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join("");
}




// ==========================
// GUARDAR
// ==========================
async function guardarProducto() {
    
    const producto = {
        
        name: document.getElementById("name").value,
        price: Number(document.getElementById("price").value),
        oldPrice: Number(document.getElementById("oldPrice").value),
        category: document.getElementById("category").value,
        description: quill.root.innerHTML,
        images: document.getElementById("images").value,
        video: document.getElementById("video").value,
        variants: document.getElementById("variants").value,
        origin: document.getElementById("origin").value,
        bodegaName: document.getElementById("bodegaName").value,
        freeShipping: document.getElementById("freeShipping").value
        
    };
    
    if (productoEditando) {
        
        producto.id = productoEditando;
        
    }
    
    const res = await fetch("/api/producto", {
        
        method: productoEditando ? "PUT" : "POST",
        
        headers: {
            "Content-Type": "application/json"
        },
        
        body: JSON.stringify(producto)
        
    });
    
    const data = await res.json();
    
    if (!data.success) {
        
        alert(data.error);
        return;
        
    }
    
    alert(
        productoEditando ?
        "Producto actualizado correctamente." :
        "Producto guardado correctamente."
    );
    
    limpiarFormulario();
    
    cargarProductos();
    
}

// ==========================
// LIMPIAR
// ==========================
function limpiarFormulario() {
    
    productoEditando = null;
    
    [
        "name",
        "price",
        "oldPrice",
        "category",
        "images",
        "video",
        "variants",
        "origin",
        "bodegaName",
        "freeShipping"
        
    ].forEach(id => {
        
        document.getElementById(id).value = "";
        
    });
    
    quill.setContents([]);
    
    document.getElementById("btnGuardar").innerHTML =
        "+ Nuevo Producto";
    
}

// ==========================
// EDITAR
// ==========================
function editarProducto(id) {
    
    const p = productos.find(x => x.id === id);
    
    if (!p) return;
    
    productoEditando = p.id;
    
    document.getElementById("name").value = p.name || "";
    document.getElementById("price").value = p.price || "";
    document.getElementById("oldPrice").value = p.oldPrice || "";
    document.getElementById("category").value = p.category || "";
    quill.root.innerHTML = p.description || "";
    document.getElementById("images").value = p.images || "";
    document.getElementById("video").value = p.video || "";
    document.getElementById("variants").value = p.variants || "";
    document.getElementById("origin").value = p.origin || "";
    document.getElementById("bodegaName").value = p.bodegaName || "";
    document.getElementById("freeShipping").value = p.freeShipping || "";
    
    document.getElementById("btnGuardar").innerHTML =
        "💾 Actualizar Producto";
    
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
    
}

// ==========================
// ELIMINAR
// ==========================
async function eliminarProducto(id) {
    
    if (!confirm("¿Eliminar este producto?"))
        return;
    
    await fetch("/api/producto?id=" + id, {
        
        method: "DELETE"
        
    });
    
    cargarProductos();
    
}

// ==========================
// BUSCADOR
// ==========================
document.getElementById("buscar").addEventListener("input", e => {
    
    const texto = e.target.value.toLowerCase();
    
    renderLista(
        
        productos.filter(p =>
            
            p.name.toLowerCase().includes(texto) ||
            
            p.category.toLowerCase().includes(texto)
            
        )
        
    );
    
});

cargarProductos();

// ==========================================================
// VISTAS Y NAVEGACIÓN DEL PANEL (PRODUCTOS VS CONFIGURACIÓN)
// ==========================================================
window.cambiarVista = function(vista) {
    const vistaProd = document.getElementById("vistaProductos");
    const vistaConf = document.getElementById("vistaConfiguracion");
    const btnProd = document.getElementById("btnVistaProductos");
    const btnConf = document.getElementById("btnVistaConfig");

    if (vista === "productos") {
        // Mostrar Productos y Ocultar Configuración
        vistaProd.classList.remove("hidden");
        vistaConf.classList.add("hidden");
        
        // Estilos activos de botones
        btnProd.className = "w-full text-left bg-indigo-600 text-white px-4 py-3 rounded-xl font-semibold transition-all";
        btnConf.className = "w-full text-left hover:bg-slate-800 text-slate-300 px-4 py-3 rounded-xl transition-all";
    } else if (vista === "configuracion") {
        // Mostrar Configuración y Ocultar Productos
        vistaProd.classList.add("hidden");
        vistaConf.classList.remove("hidden");
        
        // Estilos activos de botones
        btnConf.className = "w-full text-left bg-indigo-600 text-white px-4 py-3 rounded-xl font-semibold transition-all";
        btnProd.className = "w-full text-left hover:bg-slate-800 text-slate-300 px-4 py-3 rounded-xl transition-all";
    }
    
    // Si estás en móvil, cierra el sidebar automáticamente al cambiar de vista
    if (window.innerWidth < 1024) {
        document.getElementById("sidebar").classList.add("-translate-x-full");
        document.getElementById("overlay").classList.add("hidden");
    }
};

// ==========================================================
// ENVIAR CAMBIO DE CONTRASEÑA Y USUARIO AL BACKEND (PUT)
// ==========================================================
window.cambiarCredencialesAdmin = async function(event) {
    event.preventDefault(); // Evitar que la página recargue al enviar el formulario

    const msgDiv = document.getElementById("configMessage");
    const btnSubmit = document.getElementById("btnConfigSubmit");
    
    const currentUsername = document.getElementById("currentUsername").value;
    const newUsername = document.getElementById("newUsername").value;
    const newPassword = document.getElementById("newPassword").value;

    // Reiniciar estados visuales
    msgDiv.className = "hidden text-xs font-bold p-3 rounded-xl text-center";
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Actualizando seguridad en D1...";

    try {
        const response = await fetch("/api/login", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentUsername, newUsername, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "No se pudieron actualizar los datos de acceso.");
        }

        // Éxito: Mostrar alerta bonita y forzar cierre de sesión
        msgDiv.innerText = "✅ Credenciales cambiadas con éxito. Redirigiendo...";
        msgDiv.classList.remove("hidden");
        msgDiv.classList.add("bg-green-50", "text-green-600");

        setTimeout(() => {
            // Recargamos la pestaña. Al haberse eliminado la cookie desde el servidor en el PUT, 
            // el middleware bloqueará el acceso y lo mandará directo al Login.
            location.reload();
        }, 2000);

    } catch (err) {
        // Error catastrófico o de validación
        msgDiv.innerText = "⚠️ " + err.message;
        msgDiv.classList.remove("hidden");
        msgDiv.classList.add("bg-red-50", "text-red-600");
        
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Guardar Nuevas Credenciales";
    }
};
