// functions/api/login.js

// Función auxiliar para verificar la contraseña usando criptografía nativa de Cloudflare (PBKDF2)
async function verificarPassword(passwordPlano, hashGuardado) {
    try {
        if (!hashGuardado || !hashGuardado.includes('.')) return false;
        
        const [saltHex, originalHashHex] = hashGuardado.split('.');
        if (!saltHex || !originalHashHex) return false;
        
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(passwordPlano);
        const saltBuffer = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        
        const baseKey = await crypto.subtle.importKey(
            "raw",
            passwordBuffer,
            "PBKDF2",
            false,
            ["deriveBits", "deriveKey"]
        );
        
        const hashDerivadoBuffer = await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                salt: saltBuffer,
                iterations: 100000,
                hash: "SHA-256"
            },
            baseKey,
            256
        );
        
        const hashDerivadoHex = Array.from(new Uint8Array(hashDerivadoBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        return hashDerivadoHex === originalHashHex;
    } catch (e) {
        console.error("Error en verificación criptográfica:", e);
        return false;
    }
}

// Handler de Cloudflare Pages para interceptar peticiones POST en /api/login
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const bodyText = await request.text();
        if (!bodyText) {
            return new Response(JSON.stringify({ error: "Petición vacía recibida en el servidor." }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        const { username, password } = JSON.parse(bodyText);
        
        if (!username || !password) {
            return new Response(JSON.stringify({ error: "Por favor, llena todos los campos." }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        // Validar vinculación de D1
        if (!env.DB) {
            return new Response(JSON.stringify({ error: "Error: La variable 'env.DB' no está vinculada en el panel de Cloudflare." }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        // ==========================================================
        // ATAJO TEMPORAL: AUTO-CREAR EL USUARIO EXACTO EN TU D1
        // ==========================================================
        if (username.trim() === "crearadmin" && password === "Admin123456") {
            const encoder = new TextEncoder();
            const saltBuffer = crypto.getRandomValues(new Uint8Array(16));
            const saltHex = Array.from(saltBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
            
            const baseKey = await crypto.subtle.importKey(
                "raw", encoder.encode("Admin123456"), "PBKDF2", false, ["deriveBits"]
            );
            const hashBuffer = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBuffer, iterations: 100000, hash: "SHA-256" },
                baseKey, 256
            );
            const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            const nuevoHashCompleto = `${saltHex}.${hashHex}`;
            
            // Limpiar e Insertar en D1 usando el motor de Cloudflare
            await env.DB.prepare("DELETE FROM admin_users WHERE username = 'admin'").run();
            await env.DB.prepare("INSERT INTO admin_users (username, password_hash) VALUES ('admin', ?)")
                .bind(nuevoHashCompleto)
                .run();
            
            return new Response(JSON.stringify({ error: "✅ ¡Usuario 'admin' creado con éxito en D1! Ahora inicia sesión normalmente con usuario: admin y clave: Admin123456" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
        // ==========================================================
        
        // 1. Buscar el administrador en la tabla de D1
        let user;
        try {
            user = await env.DB.prepare("SELECT * FROM admin_users WHERE username = ?")
                .bind(username.trim().toLowerCase())
                .first();
        } catch (dbError) {
            return new Response(JSON.stringify({ error: "Error en D1: " + dbError.message + ". ¿Creaste la tabla 'admin_users'?" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        if (!user) {
            return new Response(JSON.stringify({ error: "Usuario o contraseña incorrectos." }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        // 2. Validar la contraseña criptográficamente
        const esValida = await verificarPassword(password, user.password_hash);
        
        if (!esValida) {
            return new Response(JSON.stringify({ error: "Usuario o contraseña incorrectos." }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        // 3. Login Exitoso: Generar un token único
        const tokenSession = crypto.randomUUID();
        
        return new Response(JSON.stringify({ success: true, token: tokenSession }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Set-Cookie": `admin_session=${tokenSession}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: "Error crítico en el backend: " + error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Endpoint para borrar la cookie de sesión de forma segura desde el servidor
export async function onRequestDelete(context) {
    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            // Le decimos al navegador que expire la cookie inmediatamente poniéndole Max-Age=0
            "Set-Cookie": "admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
        }
    });
    
} // <--- ESTA LLAVE CIERRA LA FUNCIÓN onRequestDelete ANTERIOR

// ==========================================================
// ENDPOINT PARA ACTUALIZAR CREDENCIALES (MÉTODO PUT)
// ==========================================================
// ==========================================================
// ENDPOINT PARA ACTUALIZAR CREDENCIALES (MÉTODO PUT) - OPTIMIZADO
// ==========================================================
export async function onRequestPut(context) {
    const { request, env } = context;

    try {
        const bodyText = await request.text();
        if (!bodyText) {
            return new Response(JSON.stringify({ error: "Petición vacía recibida en el servidor." }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const { currentUsername, newUsername, newPassword } = JSON.parse(bodyText);

        if (!currentUsername || !newUsername || !newPassword) {
            return new Response(JSON.stringify({ error: "Por favor, llena todos los campos del formulario." }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (newPassword.length < 6) {
            return new Response(JSON.stringify({ error: "La nueva contraseña debe tener al menos 6 caracteres." }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // 1. Verificar si el usuario administrador actual ingresado existe en D1
        const user = await env.DB.prepare("SELECT * FROM admin_users WHERE username = ?")
            .bind(currentUsername.trim().toLowerCase())
            .first();

        if (!user) {
            return new Response(JSON.stringify({ error: "El 'Usuario Actual' proporcionado no es correcto." }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        // 2. Generar un nuevo hash seguro (PBKDF2) para la nueva contraseña
        const encoder = new TextEncoder();
        const saltBuffer = crypto.getRandomValues(new Uint8Array(16)); 
        const saltHex = Array.from(saltBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
        
        const baseKey = await crypto.subtle.importKey(
            "raw", 
            encoder.encode(newPassword), 
            "PBKDF2", 
            false, 
            ["deriveBits"]
        );
        
        const hashBuffer = await crypto.subtle.deriveBits(
            { 
                name: "PBKDF2", 
                salt: saltBuffer, 
                iterations: 100000, 
                hash: "SHA-256" 
            },
            baseKey, 
            256
        );
        
        const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        const nuevoHashCompleto = `${saltHex}.${hashHex}`;

        // 3. Actualizar el registro en la base de datos filtrando por el username actual validado
        await env.DB.prepare("UPDATE admin_users SET username = ?, password_hash = ? WHERE username = ?")
            .bind(newUsername.trim().toLowerCase(), nuevoHashCompleto, currentUsername.trim().toLowerCase())
            .run();

        // 4. Responder con éxito y limpiar la cookie de sesión (Max-Age=0) para forzar reautenticación
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Set-Cookie": "admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Error crítico en el servidor: " + error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}



    
