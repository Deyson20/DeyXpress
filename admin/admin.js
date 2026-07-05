const API = "/api/productos";

async function cargarProductos() {

    const res = await fetch(API);
    const productos = await res.json();

    const lista = document.getElementById("lista");

    if (!productos.length) {

        lista.innerHTML = `
            <div class="bg-white rounded-xl shadow p-6 text-center text-gray-500">
                No hay productos registrados.
            </div>
        `;

        return;
    }

    lista.innerHTML = productos.map(p => `

        <div class="bg-white rounded-xl shadow p-5 mb-4">

            <div class="flex justify-between items-center">

                <div>

                    <h2 class="font-bold text-xl">${p.name}</h2>

                    <p class="text-gray-500">
                        ${p.category}
                    </p>

                    <p class="text-indigo-600 font-bold mt-2">
                        $${Number(p.price).toLocaleString()}
                    </p>

                </div>

                <div>

                    <button
                        class="bg-red-600 text-white px-4 py-2 rounded"
                        onclick="eliminarProducto('${p.id}')">

                        Eliminar

                    </button>

                </div>

            </div>

        </div>

    `).join("");

}

async function guardarProducto() {

    const producto = {

        name: document.getElementById("name").value,
        price: Number(document.getElementById("price").value),
        oldPrice: Number(document.getElementById("oldPrice").value),
        category: document.getElementById("category").value,
        description: document.getElementById("description").value,
        images: document.getElementById("images").value,
        video: document.getElementById("video").value,
        variants: document.getElementById("variants").value,
        origin: document.getElementById("origin").value,
        bodegaName: document.getElementById("bodegaName").value,
        freeShipping: document.getElementById("freeShipping").value

    };

    const res = await fetch("/api/producto", {

        method: "POST",

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

    alert("Producto guardado");

    location.reload();

}

async function eliminarProducto(id){

    if(!confirm("¿Eliminar este producto?")) return;

    await fetch("/api/producto?id="+id,{

        method:"DELETE"

    });

    location.reload();

}

cargarProductos();