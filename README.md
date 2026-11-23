# 📚 BookMania — Full Stack Library Management System

> A full stack Library Management System built with **Spring Boot** and **React**.

---

## 🔗 Repositories

| | Repository |
|--|--|
| **Backend** | https://github.com/costanna/BookMania_Backend |
| **Frontend** | https://github.com/costanna/BookMania_Frontend |

---

## 🛠️ Tech Stack

### Backend
- Java 21
- Spring Boot 3.2
- Spring Security + JWT (JJWT 0.12.3)
- Spring Data JPA (Hibernate)
- PostgreSQL
- Maven

### Frontend
- React + Vite
- Tailwind CSS v3
- React Router v6
- Axios with JWT interceptors
- Context API

---

## ✨ Features

- **Authentication** — Register, login and JWT with `ADMIN` and `USER` roles
- **Catalogue** — Full CRUD for books and categories with automatic cover images via Google Books API
- **Loans** — Issue, extend (up to 3 times) and return books
- **Fines** — Automatic time-based penalty for overdue returns
- **Reservations** — Waiting queue with a maximum of 3 people per book
- **Admin Panel** — Full management of books, categories, loans, fines and reservations

---

## 📋 Business Rules

| Rule | Value |
|------|-------|
| Loan duration | 21 days |
| Max extensions | 3 × 10 days each |
| Overdue penalty | 7 base days + 2 days per day overdue |
| Reservation queue | Max 3 people per book |
| Penalty block | Users with active penalty cannot borrow or reserve |
| Auto-notification | First in queue notified automatically on return |

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login — returns JWT token |

### Books
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/books` | Public | List books with filters (paginated) |
| `GET` | `/api/books/{id}` | Public | Get book details |
| `POST` | `/api/books` | ADMIN | Create a book |
| `PUT` | `/api/books/{id}` | ADMIN | Update a book |
| `DELETE` | `/api/books/{id}` | ADMIN | Delete a book |

### Categories
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/categories` | Public | List all categories |
| `POST` | `/api/categories` | ADMIN | Create a category |
| `PUT` | `/api/categories/{id}` | ADMIN | Update a category |
| `DELETE` | `/api/categories/{id}` | ADMIN | Delete a category |

### Loans
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/loans` | USER | Request a loan |
| `GET` | `/api/loans/my` | USER | My loan history |
| `GET` | `/api/loans` | ADMIN | All loans |
| `PUT` | `/api/loans/{id}/extend` | USER | Extend a loan by 10 days |
| `PUT` | `/api/loans/{id}/return` | USER | Return a book |

### Fines
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/fines/my` | USER | My active penalties |
| `GET` | `/api/fines` | ADMIN | All fines |
| `DELETE` | `/api/fines/{id}` | ADMIN | Cancel a fine |

### Reservations
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/reservations` | USER | Create a reservation |
| `DELETE` | `/api/reservations/{id}` | USER | Cancel a reservation |
| `GET` | `/api/reservations/my` | USER | My reservations |
| `GET` | `/api/reservations` | ADMIN | All reservations |

---

## 🚀 Local Setup

### Backend

**Prerequisites:** Java 21+, PostgreSQL, Maven

```bash
# 1. Clone the repository
git clone https://github.com/costanna/BookMania_Backend.git
cd BookMania_Backend

# 2. Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE bookmania_db;"

# 3. Run the application
mvn spring-boot:run
```

Configure `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/bookmania_db
spring.datasource.username=postgres
spring.datasource.password=your_password
jwt.secretKey=your_secret_key
jwt.expiration=86400000
```

> API available at `http://localhost:8080`

---

### Frontend

**Prerequisites:** Node.js 18+, npm

```bash
# 1. Clone the repository
git clone https://github.com/costanna/BookMania_Frontend.git
cd BookMania_Frontend

# 2. Install dependencies
npm install

# 3. Create .env file
echo "VITE_API_URL=http://localhost:8080" > .env

# 4. Start the app
npm run dev
```

> App available at `http://localhost:5173`

---

## 🚢 Deploying to Vercel

The frontend is a static Vite build served by [Vercel](https://vercel.com). Build settings,
the SPA fallback that `BrowserRouter` needs and long-term caching for hashed assets are all in
[`vercel.json`](vercel.json). Step-by-step guide: [`DEPLOY.md`](DEPLOY.md).

1. Deploy the backend first (Render, see its own README) and grab its public URL, e.g.
   `https://bookmania-backend.onrender.com`.
2. On [vercel.com/new](https://vercel.com/new), import this repo. Vercel picks up `vercel.json`
   (Vite, `npm run build`, `dist/`).
3. Under **Environment Variables**, set `VITE_API_URL` to that backend URL (no trailing slash).
   > Vite bakes `VITE_*` variables into the bundle **at build time**: changing the value later
   > has no effect until you redeploy.
4. Deploy. Every push to `main` redeploys production; other branches get preview URLs.
5. In Render, set the backend's `CORS_ALLOWED_ORIGINS` to this frontend's Vercel URL — otherwise
   the browser will block the API calls.

The `Dockerfile` (static build served with `serve`) is no longer used in production; it's still
handy to try the production build locally with `docker build`/`docker run`.

---

## 🔌 Connecting Frontend to Backend

The frontend connects to the backend via Axios. The base URL is set in `.env` and the JWT token is automatically attached to every authenticated request via an interceptor:

```javascript
// src/api/axiosInstance.js
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## 📁 Project Structure

### Backend

```
src/main/java/com/bookmania/bookmania/
├── Configuration/    # SecurityConfig, JwtProperties
├── Controller/       # REST controllers
├── Dtos/             # Request and Response DTOs
├── Entity/           # JPA entities
├── Enums/            # LoanStatus, ReservationStatus, Role
├── Exception/        # GlobalExceptionHandler + custom exceptions
├── Repository/       # Spring Data JPA repositories
├── Scheduler/        # LoanScheduler — marks loans as OVERDUE
├── Security/         # JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
└── Services/         # Business logic
```

### Frontend

```
src/
├── api/              # axiosInstance, authService, bookService...
├── components/       # Navbar, Layout, ConfirmModal, Toast, Skeleton
├── context/          # AuthContext, AuthProvider, ToastContext
├── hooks/            # useAuth, useToast
├── pages/            # auth/, books/, loans/, fines/, reservations/, admin/
├── routes/           # AppRouter, PrivateRoute, AdminRoute
└── utils/            # bookCover.js (Google Books API)
```

---

---

# 📚 BookMania — Sistema de Gestión de Bibliotecas Full Stack

> Sistema de gestión de bibliotecas full stack desarrollado con **Spring Boot** y **React**.

---

## 🔗 Repositorios

| | Repositorio |
|--|--|
| **Backend** | https://github.com/costanna/BookMania_Backend |
| **Frontend** | https://github.com/costanna/BookMania_Frontend |

---

## 🛠️ Stack tecnológico

### Backend
- Java 21
- Spring Boot 3.2
- Spring Security + JWT (JJWT 0.12.3)
- Spring Data JPA (Hibernate)
- PostgreSQL
- Maven

### Frontend
- React + Vite
- Tailwind CSS v3
- React Router v6
- Axios con interceptores JWT
- Context API

---

## ✨ Características

- **Autenticación** — Registro, login y JWT con roles `ADMIN` y `USER`
- **Catálogo** — CRUD completo de libros y categorías con portadas automáticas via Google Books API
- **Préstamos** — Emisión, prórroga (hasta 3 veces) y devolución de libros
- **Multas** — Penalización temporal automática por retrasos en la devolución
- **Reservas** — Cola de espera con máximo 3 personas por libro
- **Panel de administración** — Gestión completa de libros, categorías, préstamos, multas y reservas

---

## 📋 Reglas de negocio

| Regla | Valor |
|-------|-------|
| Duración del préstamo | 21 días |
| Prórrogas máximas | 3 × 10 días cada una |
| Penalización por retraso | 7 días base + 2 días por cada día de retraso |
| Cola de reservas | Máximo 3 personas por libro |
| Bloqueo por penalización | Los usuarios con penalización activa no pueden pedir préstamos ni reservas |
| Notificación automática | El primero de la cola es notificado automáticamente al devolver un libro |

---

## 🌐 Endpoints de la API

### Autenticación
| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/register` | Público | Registro de usuario |
| `POST` | `/api/auth/login` | Público | Login — devuelve JWT |

### Libros
| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| `GET` | `/api/books` | Público | Listar libros con filtros (paginado) |
| `GET` | `/api/books/{id}` | Público | Detalle de un libro |
| `POST` | `/api/books` | ADMIN | Crear libro |
| `PUT` | `/api/books/{id}` | ADMIN | Actualizar libro |
| `DELETE` | `/api/books/{id}` | ADMIN | Eliminar libro |

### Categorías
| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| `GET` | `/api/categories` | Público | Listar categorías |
| `POST` | `/api/categories` | ADMIN | Crear categoría |
| `PUT` | `/api/categories/{id}` | ADMIN | Actualizar categoría |
| `DELETE` | `/api/categories/{id}` | ADMIN | Eliminar categoría |

### Préstamos
| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| `POST` | `/api/loans` | USER | Solicitar préstamo |
| `GET` | `/api/loans/my` | USER | Mis préstamos |
| `GET` | `/api/loans` | ADMIN | Todos los préstamos |
| `PUT` | `/api/loans/{id}/extend` | USER | Prorrogar préstamo 10 días |
| `PUT` | `/api/loans/{id}/return` | USER | Devolver libro |

### Multas
| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| `GET` | `/api/fines/my` | USER | Mis penalizaciones activas |
| `GET` | `/api/fines` | ADMIN | Todas las multas |
| `DELETE` | `/api/fines/{id}` | ADMIN | Anular una multa |

### Reservas
| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| `POST` | `/api/reservations` | USER | Crear reserva |
| `DELETE` | `/api/reservations/{id}` | USER | Cancelar reserva |
| `GET` | `/api/reservations/my` | USER | Mis reservas |
| `GET` | `/api/reservations` | ADMIN | Todas las reservas |

---

## 🚀 Instalación local

### Backend

**Requisitos previos:** Java 21+, PostgreSQL, Maven

```bash
# 1. Clona el repositorio
git clone https://github.com/costanna/BookMania_Backend.git
cd BookMania_Backend

# 2. Crea la base de datos
psql -U postgres -c "CREATE DATABASE bookmania_db;"

# 3. Arranca la aplicación
mvn spring-boot:run
```

Configura `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/bookmania_db
spring.datasource.username=postgres
spring.datasource.password=tu_password
jwt.secretKey=tu_secret_key
jwt.expiration=86400000
```

> API disponible en `http://localhost:8080`

---

### Frontend

**Requisitos previos:** Node.js 18+, npm

```bash
# 1. Clona el repositorio
git clone https://github.com/costanna/BookMania_Frontend.git
cd BookMania_Frontend

# 2. Instala las dependencias
npm install

# 3. Crea el fichero .env
echo "VITE_API_URL=http://localhost:8080" > .env

# 4. Arranca la app
npm run dev
```

> App disponible en `http://localhost:5173`

---

## 🚢 Despliegue en Vercel

El frontend es un build estático de Vite servido por [Vercel](https://vercel.com). La
configuración de build, el fallback SPA que necesita `BrowserRouter` y la caché larga de los
assets con hash están en [`vercel.json`](vercel.json). Guía paso a paso: [`DEPLOY.md`](DEPLOY.md).

1. Despliega primero el backend (Render, ver su propio README) y copia su URL pública, p. ej.
   `https://bookmania-backend.onrender.com`.
2. En [vercel.com/new](https://vercel.com/new), importa este repo. Vercel lee `vercel.json`
   (Vite, `npm run build`, `dist/`).
3. En **Environment Variables**, configura `VITE_API_URL` con esa URL del backend (sin barra
   final).
   > Vite incrusta las variables `VITE_*` en el bundle **en tiempo de build**: si cambias el
   > valor después, no tiene efecto hasta que vuelvas a desplegar.
4. Despliega. Cada push a `main` redespliega producción; el resto de ramas generan URLs de
   preview.
5. En Render, configura `CORS_ALLOWED_ORIGINS` del backend con la URL de este frontend en
   Vercel; si no, el navegador bloqueará las peticiones a la API por CORS.

El `Dockerfile` (build estático servido con `serve`) ya no se usa en producción; sigue
siendo útil para probar el build de producción en local con `docker build`/`docker run`.

---

## 🔌 Conexión Frontend — Backend

El frontend se conecta al backend mediante Axios. La URL base se configura en `.env` y el token JWT se adjunta automáticamente en cada petición autenticada:

```javascript
// src/api/axiosInstance.js
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## 📁 Estructura del proyecto

### Backend

```
src/main/java/com/bookmania/bookmania/
├── Configuration/    # SecurityConfig, JwtProperties
├── Controller/       # Controladores REST
├── Dtos/             # Request y Response DTOs
├── Entity/           # Entidades JPA
├── Enums/            # LoanStatus, ReservationStatus, Role
├── Exception/        # GlobalExceptionHandler + excepciones custom
├── Repository/       # Repositorios Spring Data JPA
├── Scheduler/        # LoanScheduler — marca préstamos OVERDUE
├── Security/         # JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
└── Services/         # Lógica de negocio
```

### Frontend

```
src/
├── api/              # axiosInstance, authService, bookService...
├── components/       # Navbar, Layout, ConfirmModal, Toast, Skeleton
├── context/          # AuthContext, AuthProvider, ToastContext
├── hooks/            # useAuth, useToast
├── pages/            # auth/, books/, loans/, fines/, reservations/, admin/
├── routes/           # AppRouter, PrivateRoute, AdminRoute
└── utils/            # bookCover.js (Google Books API)
```

---

## 👩‍💻 Autora

**Anna Costa**
[LinkedIn](https://www.linkedin.com/in/annahico/)
[GitHub](https://github.com/costanna)