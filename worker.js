export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Cabeceras de seguridad para permitir conexión desde tu web
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Responder a la verificación del navegador
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // LEER PRODUCTOS
    if (url.pathname === "/api/productos" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM productos").all();
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // GUARDAR PRODUCTOS
    if (url.pathname === "/api/productos" && request.method === "POST") {
      try {
        const p = await request.json();
        
        // INSERT OR REPLACE para que permita editar si el ID ya existe
        await env.DB.prepare(
          "INSERT OR REPLACE INTO productos (id, name, price, category, description, images, video, variants) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          p.id, 
          p.name, 
          p.price, 
          p.category, 
          p.description, 
          JSON.stringify(p.images),
          p.video || "",
          JSON.stringify(p.variants || [])
        ).run();
        
        return new Response("OK", { status: 201, headers: corsHeaders });
      } catch (err) {
        return new Response(err.message, { status: 500, headers: corsHeaders });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
