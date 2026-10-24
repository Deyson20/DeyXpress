const textEncoder = new TextEncoder();
const sessionCookieName = "turnero_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeBase64Url(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signingKey(env) {
  const secret = env.SESSION_SECRET;
  if (typeof secret !== "string" || secret.length === 0) {
    throw new Error("SESSION_SECRET no está configurado en el entorno activo.");
  }
  if (secret.length < 32) {
    throw new Error(`SESSION_SECRET debe tener al menos 32 caracteres; se recibieron ${secret.length}.`);
  }

  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signSession(session, env) {
  const payload = encodeBase64Url(textEncoder.encode(JSON.stringify(session)));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(env), textEncoder.encode(payload));
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

async function readSession(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const value = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`))
    ?.slice(sessionCookieName.length + 1);

  if (!value) return null;

  try {
    const [payload, signature, extra] = value.split(".");
    if (!payload || !signature || extra !== undefined) return null;

    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(env),
      decodeBase64Url(signature),
      textEncoder.encode(payload),
    );
    if (!valid) return null;

    const session = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    if (
      !Number.isSafeInteger(session.index) ||
      session.index < 0 ||
      typeof session.csrf !== "string" ||
      !Number.isSafeInteger(session.exp) ||
      session.exp <= Date.now()
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function setSessionCookie(session, request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${sessionCookieName}=${session.value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionLifetimeSeconds}${secure}`;
}

async function createSession(request, env, index = 0, csrf = null) {
  const session = {
    index,
    csrf: csrf || encodeBase64Url(crypto.getRandomValues(new Uint8Array(32))),
    exp: Date.now() + sessionLifetimeSeconds * 1000,
  };
  return {
    session,
    cookie: setSessionCookie({ value: await signSession(session, env) }, request),
  };
}

async function requireCsrf(request, env) {
  const session = await readSession(request, env);
  const token = request.headers.get("X-CSRF-Token");
  if (!session || !token || token !== session.csrf) {
    return { response: json({ error: "Sesión inválida. Recarga la página e inténtalo de nuevo." }, 403) };
  }
  return { session };
}

async function handleApi(request, env, url) {
  if (request.method === "GET" && url.pathname === "/api/session") {
    const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM persona").first();
    const total = Number(count.total);
    const current = await readSession(request, env);
    const index = total === 0 ? 0 : Math.min(current?.index ?? 0, total - 1);
    if (current && index === current.index) {
      return json({ csrf: current.csrf, index: current.index });
    }
    const { session, cookie } = await createSession(request, env, index);
    return json(
      { csrf: session.csrf, index: session.index },
      200,
      { "Set-Cookie": cookie },
    );
  }

  if (request.method === "GET" && url.pathname === "/api/people") {
    const result = await env.DB.prepare("SELECT id, nombre, puesto FROM persona ORDER BY id ASC").all();
    return json(result.results);
  }

  if (request.method === "POST" && url.pathname === "/api/people") {
    const csrf = await requireCsrf(request, env);
    if (csrf.response) return csrf.response;

    let input;
    try {
      input = await request.json();
    } catch {
      return json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, 400);
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return json({ error: "El cuerpo de la solicitud debe ser un objeto JSON." }, 400);
    }

    const nombre = typeof input.nombre === "string" ? input.nombre.trim() : "";
    const puesto = typeof input.puesto === "string" ? input.puesto.trim() : "";
    if (!nombre || !puesto || nombre.length > 120 || puesto.length > 120) {
      return json({ error: "Nombre y puesto son obligatorios y deben tener máximo 120 caracteres." }, 400);
    }

    const result = await env.DB
      .prepare("INSERT INTO persona (nombre, puesto) VALUES (?, ?)")
      .bind(nombre, puesto)
      .run();
    return json({ id: result.meta.last_row_id, nombre, puesto }, 201);
  }

  if (request.method === "DELETE" && url.pathname === "/api/people") {
    const csrf = await requireCsrf(request, env);
    if (csrf.response) return csrf.response;
    await env.DB.prepare("DELETE FROM persona").run();
    return json({ message: "Todos los registros eliminados." });
  }

  const personMatch = url.pathname.match(/^\/api\/people\/(\d+)$/);
  if (request.method === "DELETE" && personMatch) {
    const csrf = await requireCsrf(request, env);
    if (csrf.response) return csrf.response;

    const id = Number(personMatch[1]);
    if (!Number.isSafeInteger(id) || id < 1) return json({ error: "ID inválido." }, 400);
    const result = await env.DB.prepare("DELETE FROM persona WHERE id = ?").bind(id).run();
    if (result.meta.changes === 0) return json({ error: "No se encontró la persona." }, 404);
    return json({ message: "Persona eliminada." });
  }

  if (request.method === "POST" && url.pathname === "/api/turn") {
    const csrf = await requireCsrf(request, env);
    if (csrf.response) return csrf.response;

    let input;
    try {
      input = await request.json();
    } catch {
      return json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, 400);
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return json({ error: "El cuerpo de la solicitud debe ser un objeto JSON." }, 400);
    }
    if (input.direction !== "next" && input.direction !== "previous") {
      return json({ error: "Dirección de turno inválida." }, 400);
    }

    const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM persona").first();
    const total = Number(count.total);
    let index = total === 0 ? 0 : Math.min(csrf.session.index, total - 1);
    if (input.direction === "next" && index < total - 1) index += 1;
    if (input.direction === "previous" && index > 0) index -= 1;

    const { session, cookie } = await createSession(request, env, index, csrf.session.csrf);
    return json(
      { index: session.index, csrf: session.csrf },
      200,
      { "Set-Cookie": cookie },
    );
  }

  return json({ error: "Ruta no encontrada." }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env, url);
      return await env.ASSETS.fetch(request);
    } catch (error) {
      console.error(
        "Error procesando la solicitud:",
        error instanceof Error ? error.message : String(error),
      );
      return json({ error: "Ocurrió un error interno. Revisa los registros del Worker." }, 500);
    }
  },
};
