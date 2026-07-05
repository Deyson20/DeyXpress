export async function onRequest(context) {

    const { request, env } = context;

    try {

        // ============================
        // CREAR PRODUCTO
        // ============================

        if (request.method === "POST") {

            const data = await request.json();

            const id = crypto.randomUUID();

            await env.DB.prepare(`
                INSERT INTO productos (
                    id,
                    name,
                    price,
                    oldPrice,
                    category,
                    description,
                    images,
                    video,
                    variants,
                    origin,
                    bodegaName,
                    freeShipping
                )
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            `)
            .bind(
                id,
                data.name,
                data.price,
                data.oldPrice,
                data.category,
                data.description,
                data.images,
                data.video,
                data.variants,
                data.origin,
                data.bodegaName,
                data.freeShipping
            )
            .run();

            return Response.json({
                success: true,
                id
            });
        }

        // ============================
        // ELIMINAR
        // ============================

        if (request.method === "DELETE") {

            const id = new URL(request.url).searchParams.get("id");

            await env.DB.prepare(`
                DELETE FROM productos
                WHERE id=?
            `)
            .bind(id)
            .run();

            return Response.json({
                success: true
            });

        }

        // ============================
        // EDITAR
        // ============================

        if (request.method === "PUT") {

            const data = await request.json();

            await env.DB.prepare(`
                UPDATE productos SET
                    name=?,
                    price=?,
                    oldPrice=?,
                    category=?,
                    description=?,
                    images=?,
                    video=?,
                    variants=?,
                    origin=?,
                    bodegaName=?,
                    freeShipping=?
                WHERE id=?
            `)
            .bind(
                data.name,
                data.price,
                data.oldPrice,
                data.category,
                data.description,
                data.images,
                data.video,
                data.variants,
                data.origin,
                data.bodegaName,
                data.freeShipping,
                data.id
            )
            .run();

            return Response.json({
                success: true
            });

        }

        return new Response("Método no permitido", {
            status: 405
        });

    }

    catch (e) {

        return Response.json({

            success: false,

            error: e.message

        }, {

            status: 500

        });

    }

}