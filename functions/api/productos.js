export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare(`
      SELECT *
      FROM productos
      ORDER BY rowid DESC
    `).all();

    return Response.json(results, {
      headers: {
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}