export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Ruta para obtener todos los productos
    if (url.pathname === "/api/productos" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM productos"
      ).all();
      
      return new Response(JSON.stringify(results), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" // Importante para que tu index.html pueda leerlo
        }
      });
    }

    // Ruta para que el Admin guarde productos (POST)
    if (url.pathname === "/api/productos" && request.method === "POST") {
      const producto = await request.json();
      await env.DB.prepare(
        "INSERT INTO productos (id, name, price, category, description, images) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(producto.id, producto.name, producto.price, producto.category, producto.description, JSON.stringify(producto.images)).run();
      
      return new Response("Producto guardado", { status: 201 });
    }

    return new Response("Ruta no encontrada", { status: 404 });
  }
};
