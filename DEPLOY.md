# Despliegue del frontend en Vercel

El frontend es un build estático de Vite (React). Vercel lo construye en cada push y lo sirve
desde su CDN. Toda la configuración está en [`vercel.json`](vercel.json):

| Clave | Para qué |
|---|---|
| `framework: vite`, `installCommand`, `buildCommand`, `outputDirectory` | `npm ci` → `npm run build` → publica `dist/` |
| `rewrites` → `/index.html` | Fallback SPA: `BrowserRouter` necesita que cualquier ruta (`/login`, `/admin`…) devuelva `index.html`. Los ficheros que existen (JS, CSS, imágenes) se sirven tal cual |
| `headers` en `/assets/*` | Caché de 1 año para los ficheros con hash del build |

El backend va aparte, en Render (ver el `DEPLOY.md` del repo **BookMania_Backend**). Despliégalo
primero: necesitas su URL.

---

## 1. Importar el repo en Vercel

1. [vercel.com/new](https://vercel.com/new) → conecta GitHub → **Import** en
   **BookMania_Frontend**.
2. Nombre del proyecto: `bookmania` (la URL será `https://bookmania.vercel.app` si está libre;
   si no, Vercel propone otra).
3. Framework, comandos y carpeta de salida salen de `vercel.json`; no hace falta tocarlos.
4. **Environment Variables** (entorno *Production*, y *Preview* si quieres que las previews
   también usen la API):

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | URL del backend en Render, sin barra final: `https://bookmania-backend.onrender.com` |

5. **Deploy**.

> Vite incrusta `VITE_API_URL` en el JavaScript **al construir**. Si la cambias en Vercel, ve a
> *Deployments* → último deploy → *Redeploy* para que tenga efecto.

## 2. Permitir el frontend en el backend (CORS)

Copia la URL de producción de Vercel (*Project → Domains*) y ponla en Render →
`bookmania-backend` → **Environment** → `CORS_ALLOWED_ORIGINS`, exacta: con `https://` y sin
barra final. Render redespliega al guardar.

## 3. Comprobar

1. Abre la URL de Vercel. La primera carga puede mostrar el aviso de "despertando el servidor"
   hasta ~1 min: el backend gratuito de Render duerme cuando nadie lo usa.
2. El catálogo muestra los libros y el login funciona.
3. En DevTools → *Network*, las peticiones van a `https://bookmania-backend.onrender.com/api/...`
   y no hay errores de CORS en la consola.
4. Recarga estando en una ruta interna (p. ej. `/login`): debe cargar la app, no un 404.

## Día a día

- Cada push a `main` → deploy de producción automático.
- Cada push a otra rama o PR → URL de preview. El backend no permite esos orígenes por CORS, así
  que las previews solo sirven para ver la interfaz o el modo demo.
- Rollback: *Deployments* → un deploy anterior → **Promote to Production**.
- No hace falta ningún workflow de GitHub Actions: la integración de Vercel con GitHub ya
  despliega.

## Desarrollo local

```bash
cp .env.example .env   # VITE_API_URL=http://localhost:8080
npm install
npm run dev            # http://localhost:5173
```

Para probar el build de producción en local: `npm run build && npm run preview`.

## Solución de problemas

| Síntoma | Qué hacer |
|---|---|
| Las peticiones van a `undefined/api/...` o a `localhost` | Falta `VITE_API_URL` en Vercel, o se añadió después del build → *Redeploy* |
| `blocked by CORS policy` | `CORS_ALLOWED_ORIGINS` en Render no coincide exactamente con la URL de Vercel |
| 404 al recargar una ruta interna | Comprueba que `vercel.json` (con `rewrites`) está en la raíz del repo |
| El build falla | Reprodúcelo en local con `npm ci && npm run build` y revisa el log de Vercel |
| Tarda mucho la primera vez | Normal: el backend se está despertando |
