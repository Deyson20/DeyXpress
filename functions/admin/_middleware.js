// functions/admin/_middleware.js

export async function onRequest(context) {
    const { request, next } = context;
    const url = new URL(request.url);

    // 1. Extraer las cookies de la petición
    const cookieHeader = request.headers.get("Cookie") || "";
    const cookies = Object.fromEntries(
        cookieHeader.split(";").map(cookie => {
            const [key, ...value] = cookie.trim().split("=");
            return [key, value.join("=")];
        })
    );

    const sesionActiva = cookies["admin_session"];

    // 2. Si el usuario NO tiene una sesión activa, le mostramos un formulario de Login limpio
    if (!sesionActiva) {
        // En lugar de dejarlo pasar al index.html real del admin, le respondemos con este HTML de Login directo
        return new Response(htmlFormularioLogin(), {
            headers: { "Content-Type": "text/html;charset=UTF-8" }
        });
    }

    // 3. Si la sesión existe, permitimos que Cloudflare entregue tu 'admin/index.html' original sin alterar nada
    return await next();
}

// HTML incrustado del formulario de Login para cuando intenten entrar sin autorización
function htmlFormularioLogin() {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DEYXPRESS | Login Admin</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-950 min-h-screen flex items-center justify-center p-4">
        <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
            <div class="text-center mb-6">
                <img src="https://i.postimg.cc/X7Vq6JKD/logo.png" class="h-12 mx-auto mb-3" onerror="this.src='https://placehold.co/150x50?text=DEYXPRESS'">
                <h2 class="text-2xl font-black text-slate-800">Panel de Control</h2>
                <p class="text-sm text-slate-400 mt-1">Ingresa tus credenciales de administrador</p>
            </div>
            
            <form id="loginForm" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Usuario</label>
                    <input type="text" id="loginUsername" required autocomplete="username"
                           class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Contraseña</label>
                    <input type="password" id="loginPassword" required autocomplete="current-password"
                           class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm">
                </div>
                
                <div id="loginError" class="hidden text-xs font-bold text-red-500 bg-red-50 p-3 rounded-lg text-center"></div>
                
                <button type="submit" id="btnLoginSubmit"
                        class="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition">
                    Iniciar Sesión
                </button>
            </form>
        </div>

        <script>
            document.getElementById("loginForm").addEventListener("submit", async (e) => {
                e.preventDefault();
                const errorDiv = document.getElementById("loginError");
                const btnSubmit = document.getElementById("btnLoginSubmit");
                
                errorDiv.classList.add("hidden");
                btnSubmit.disabled = true;
                btnSubmit.innerText = "Verificando...";

                const username = document.getElementById("loginUsername").value;
                const password = document.getElementById("loginPassword").value;

                try {
                    const response = await fetch("/api/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username, password })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || "Error de credenciales");
                    }

                    // Si todo sale bien, la API ya configuró la cookie HttpOnly en el navegador. 
                    // Simplemente recargamos la página para que el Middleware valide y le deje ver el Admin original.
                    location.reload();

                } catch (err) {
                    errorDiv.textContent = "⚠️ " + err.message;
                    errorDiv.classList.remove("hidden");
                    btnSubmit.disabled = false;
                    btnSubmit.innerText = "Iniciar Sesión";
                }
            });
        </script>
    </body>
    </html>
    `;
}