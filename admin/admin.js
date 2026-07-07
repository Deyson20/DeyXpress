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

        return `
        <div class="bg-white rounded-2xl shadow p-5 mb-4 border border-slate-100">
            <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div class="flex gap-4 items-center">
                    <img src="${imagenUrl || 'https://via.placeholder.com/80'}" 
                         class="w-20 h-20 rounded-xl object-cover border flex-shrink-0" 
                         alt="${p.name}">
                    <div>
                        <h2 class="font-bold text-base sm:text-lg text-slate-800 leading-tight">${p.name}</h2>
                        <p class="text-slate-500 text-sm">${p.category}</p>
                        <p class="font-black text-indigo-600 mt-1">$${Number(p.price).toLocaleString()}</p>
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