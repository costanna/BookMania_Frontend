# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes VITE_* vars into the bundle at build time, so it must be passed
# as a build arg here — setting it only at runtime would have no effect.
# In Railway, service Variables are exposed as build args automatically.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Run stage ----
FROM node:22-alpine
WORKDIR /app

# Pinned so a new major of serve can't change behaviour on an unrelated rebuild.
# It reads dist/serve.json (copied from public/) for the Cache-Control headers.
RUN npm install -g serve@14.2.6

COPY --from=build /app/dist ./dist

EXPOSE 4173

# -s enables SPA fallback (all routes serve index.html, needed for BrowserRouter).
# Railway sets PORT at runtime; default to 4173 for local `docker run`.
CMD ["sh", "-c", "serve -s dist -l ${PORT:-4173}"]
