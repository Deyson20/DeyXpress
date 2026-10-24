# Turnero Claro en Cloudflare

La aplicación usa Cloudflare Workers para la API y D1 (SQLite) para guardar las personas. La sesión firmada en una cookie `HttpOnly` conserva el turno actual de cada navegador.

## Preparar el proyecto

1. Instala Node.js y crea una base D1 desde esta carpeta:

   ```powershell
   npx wrangler d1 create turnero-claro
   ```

2. Copia el `database_id` que devuelve el comando y reemplaza `REEMPLAZAR_CON_EL_ID_DE_D1` en `wrangler.toml`.
3. Aplica el esquema a D1 local y remoto:

   ```powershell
   npx wrangler d1 migrations apply turnero-claro --local
   npx wrangler d1 migrations apply turnero-claro --remote
   ```

4. Copia `.dev.vars.example` como `.dev.vars` y configura en ese archivo un secreto aleatorio de al menos 32 caracteres para desarrollo:

   ```powershell
   Copy-Item .dev.vars.example .dev.vars
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Pega el valor generado después de `SESSION_SECRET=` en `.dev.vars`.

5. Inicia localmente:

   ```powershell
   npx wrangler dev
   ```

## Publicar

Define un secreto de firma seguro para producción y despliega:

```powershell
npx wrangler secret put SESSION_SECRET
npx wrangler deploy
```

Wrangler solicitará el valor del secreto. No lo guardes en `wrangler.toml`, en el código ni en el repositorio.

## Pasar las personas existentes de MySQL a D1

La base MySQL anterior no se copia automáticamente. Exporta desde phpMyAdmin la tabla `persona` como CSV, incluyendo los encabezados `id`, `nombre` y `puesto`. Convierte el CSV al formato compatible con D1:

```powershell
node scripts/csv-to-sql.js .\personas.csv .\personas.sql
npx wrangler d1 execute turnero-claro --remote --file=.\personas.sql
```

No incluyas credenciales MySQL en el archivo exportado ni en el proyecto. Después de verificar que los datos están en D1, cambia la contraseña de la base MySQL antigua.
