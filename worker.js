export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // 1. CREAR TABLA (Por si no existe aún)
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY,
        name TEXT,
        price REAL,
        category TEXT,
        description TEXT,
        images TEXT,
        video TEXT,
        variants TEXT
      )
    `).run();

    // 2. LEER PRODUCTOS
    if (url.pathname === "/api/productos" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM productos").all();
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. GUARDAR O EDITAR PRODUCTO
    if (url.pathname === "/api/productos" && request.method === "POST") {
      try {
        const p = await request.json();
        await env.DB.prepare(`
          INSERT OR REPLACE INTO productos (id, name, price, category, description, images, video, variants)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          p.id, 
          p.name, 
          p.price, 
          p.category, 
          p.description, 
          JSON.stringify(p.images),
          p.video || "",
          JSON.stringify(p.variants || [])
        ).run();
        
        return new Response("Guardado con éxito", { status: 201, headers: corsHeaders });
      } catch (err) {
        return new Response("Error: " + err.message, { status: 500, headers: corsHeaders });
      }
    }

    return new Response("Ruta no encontrada", { status: 404, headers: corsHeaders });
  }
};
