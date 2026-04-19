# twitter-clone

Aplicación tipo Twitter que permite a usuarios autenticados publicar posts de hasta 140 caracteres en un feed público global. Desarrollado como proyecto académico para la asignatura **Transformación Digital y Soluciones Empresariales (TDSE)** — Escuela Colombiana de Ingeniería Julio Garavito.

---

## Descripción del proyecto

TwitterClone permite a cualquier visitante ver el feed público de posts sin necesidad de autenticarse. Los usuarios que inician sesión con Auth0 pueden crear posts de hasta 140 caracteres y eliminar sus propios posts. El sistema registra automáticamente al usuario en la primera sesión usando los datos del token JWT.

---

## Arquitectura

El proyecto evoluciona de monolito a microservicios:

```
┌─────────────────────────────────────────────────────────────┐
│                    FASE 1 — MONOLITO                        │
│                                                             │
│   [React/TS Frontend]  ──→  [Spring Boot Monolith]         │
│         │                      ├── UserService              │
│         │                      ├── PostService              │
│         │                      └── StreamService            │
│         │                           │                       │
│         └──── Auth0 (JWT) ──────────┘                       │
│                                     │                       │
│                               [H2 / Postgres]               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 FASE 2 — MICROSERVICIOS (Parte 5)           │
│                                                             │
│   [React/TS Frontend]                                       │
│         │                                                   │
│         ▼                                                   │
│   [AWS API Gateway]                                         │
│     ┌───┼───────┐                                           │
│     ▼   ▼       ▼                                           │
│  [λ User] [λ Posts] [λ Stream]   ← AWS Lambda              │
│         │                                                   │
│   [Auth0 JWT]  [AWS RDS / DynamoDB]                         │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de autenticación Auth0

```
Usuario → Frontend → Auth0 (login) → JWT access token
                                         │
                         Frontend lo envía como Bearer en cada request
                                         │
                         Backend valida firma con JWKS de Auth0
                                         │
                         Si válido → procesa request
```

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + TypeScript | 18.3 / 5.5 |
| Auth (frontend) | Auth0 React SDK | 2.2.4 |
| HTTP client | Axios | 1.7 |
| Backend | Spring Boot | 3.2.5 |
| Lenguaje backend | Java | 21 |
| Seguridad | Spring Security OAuth2 Resource Server | 6.2 |
| Proveedor de identidad | Auth0 (RS256 JWT) | — |
| Base de datos (dev) | H2 (archivo local) | — |
| Base de datos (prod) | PostgreSQL | — |
| Documentación API | SpringDoc OpenAPI / Swagger UI | 2.5 |
| Microservicios | AWS Lambda + API Gateway | — |
| Hosting frontend | Amazon S3 (static website) | — |

---

## Estructura del repositorio

```
twitter-clone/
├── .gitignore                    ← Cubre backend + frontend + microservicios
├── README.md                     ← Este archivo
│
├── backend/                      ← Monolito Spring Boot
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   └── src/
│       ├── main/
│       │   ├── java/eci/tdse/twitter_clone/
│       │   │   ├── config/
│       │   │   │   ├── SecurityConfig.java
│       │   │   │   ├── AudienceValidator.java
│       │   │   │   └── OpenApiConfig.java
│       │   │   ├── controller/
│       │   │   │   ├── PostController.java
│       │   │   │   ├── StreamController.java
│       │   │   │   └── UserController.java
│       │   │   ├── dto/
│       │   │   │   ├── request/  (CreatePostRequest, UpdateProfileRequest)
│       │   │   │   └── response/ (PostResponse, UserResponse)
│       │   │   ├── entity/       (User, Post, Stream)
│       │   │   ├── exception/    (GlobalExceptionHandler)
│       │   │   ├── repository/   (UserRepository, PostRepository, StreamRepository)
│       │   │   └── service/      (UserService, PostService, StreamService)
│       │   └── resources/
│       │       └── application.yml
│       └── test/
│           ├── java/.../PostControllerTest.java
│           └── resources/application-test.yml
│
├── frontend/                     ← App React + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── types.ts
│       ├── auth0-config.ts
│       ├── App.tsx
│       ├── react-app-env.d.ts
│       ├── components/
│       │   ├── Navbar.tsx/css
│       │   ├── PostForm.tsx/css
│       │   ├── PostCard.tsx/css
│       │   ├── Feed.tsx/css
│       │   └── UserProfile.tsx/css
│       ├── hooks/
│       │   └── useApi.ts
│       └── services/
│           └── api.ts
│
└── microservices/                ← AWS Lambda (Parte 5 — pendiente)
    ├── user-service/
    ├── posts-service/
    └── stream-service/
```

---

## Configuración local

### Requisitos previos

- Java 21
- Node.js 18+
- Maven 3.9+ (o usar `./mvnw` incluido)
- Cuenta en [Auth0](https://auth0.com) (plan gratuito es suficiente)

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU-ORG/twitter-clone.git
cd twitter-clone
```

### 2. Configurar Auth0

#### Crear la SPA Application
1. Dashboard → **Applications** → **Create Application**
2. Nombre: `TwitterClone Frontend`, tipo: **Single Page Application**
3. Pestaña Settings → configurar URLs:

```
Allowed Callback URLs:  http://localhost:3000
Allowed Logout URLs:    http://localhost:3000
Allowed Web Origins:    http://localhost:3000
```

#### Crear la API
1. Dashboard → **APIs** → **Create API**
2. Nombre: `TwitterClone API`
3. Identifier: `https://api.twitterclone.com`
4. Algorithm: **RS256**
5. En la pestaña de tu SPA → **APIs** → activar **User Access** para TwitterClone API

#### Agregar claims al access token
1. **Actions → Library → Create Action** → Build from scratch
2. Nombre: `Add user claims`, Trigger: **Login / Post Login**
3. Código:

```js
exports.onExecutePostLogin = async (event, api) => {
  api.accessToken.setCustomClaim('nickname', event.user.nickname);
  api.accessToken.setCustomClaim('email', event.user.email);
  api.accessToken.setCustomClaim('picture', event.user.picture);
};
```

4. **Deploy** → **Actions → Triggers → post-login** → arrastrar action → **Apply**

### 3. Ejecutar el backend

Edita `backend/src/main/resources/application.yml` con tu dominio Auth0:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://TU-DOMINIO.auth0.com/
          jwk-set-uri: https://TU-DOMINIO.auth0.com/.well-known/jwks.json

auth0:
  domain: TU-DOMINIO.auth0.com
  audience: https://api.twitterclone.com
```

```bash
cd backend
./mvnw spring-boot:run
```

| URL | Descripción |
|-----|-------------|
| `http://localhost:8080/api/stream` | Feed público |
| `http://localhost:8080/swagger-ui.html` | Documentación Swagger |
| `http://localhost:8080/h2-console` | Consola base de datos (dev) |

### 4. Ejecutar el frontend

```bash
cd frontend
cp .env.example .env
```

Edita `frontend/.env`:

```env
REACT_APP_AUTH0_DOMAIN=TU-DOMINIO.auth0.com
REACT_APP_AUTH0_CLIENT_ID=TU-CLIENT-ID
REACT_APP_AUTH0_AUDIENCE=https://api.twitterclone.com
REACT_APP_API_BASE_URL=http://localhost:8080
```

```bash
npm install
npm start
```

App disponible en `http://localhost:3000`

---

## Endpoints de la API

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/api/stream` | ❌ Público | Feed global de posts (paginado) |
| `GET` | `/api/posts` | ❌ Público | Todos los posts |
| `GET` | `/api/posts/{id}` | ❌ Público | Un post específico |
| `POST` | `/api/posts` | ✅ JWT | Crear post (máx 140 chars) |
| `DELETE` | `/api/posts/{id}` | ✅ JWT | Eliminar propio post |
| `GET` | `/api/me` | ✅ JWT | Perfil del usuario autenticado |
| `PUT` | `/api/me` | ✅ JWT | Actualizar perfil |
| `GET` | `/api/users/{id}` | ❌ Público | Perfil público de un usuario |

La documentación completa con ejemplos de request/response está disponible en Swagger UI (`/swagger-ui.html`).

---

## Reporte de tests

### Tests automatizados del backend

Se implementaron **9 tests de integración** en `PostControllerTest.java` usando `MockMvc` y JWT simulados con `SecurityMockMvcRequestPostProcessors.jwt()`, sin necesidad de conectarse a Auth0 real. Se ejecutan con perfil `test` usando H2 en memoria.

```bash
cd backend
./mvnw test
```

| # | Test | Descripción | Resultado |
|---|------|-------------|-----------|
| 1 | `getPostsPublic` | `GET /api/posts` sin token | ✅ 200 OK |
| 2 | `getStreamPublic` | `GET /api/stream` sin token | ✅ 200 OK |
| 3 | `createPost_withValidJwt` | `POST /api/posts` con JWT válido | ✅ 201 Created |
| 4 | `createPost_withoutJwt` | `POST /api/posts` sin token | ✅ 401 Unauthorized |
| 5 | `createPost_tooLong` | Post de 141 caracteres | ✅ 400 Bad Request |
| 6 | `createPost_empty` | Post con contenido vacío | ✅ 400 Bad Request |
| 7 | `getMyProfile_withValidJwt` | `GET /api/me` con JWT | ✅ 200 OK |
| 8 | `getMyProfile_withoutJwt` | `GET /api/me` sin token | ✅ 401 Unauthorized |
| 9 | `deletePost_notOwner` | `DELETE` de post ajeno | ✅ 403 Forbidden |

**Todos los tests pasan correctamente.**

### Pruebas manuales del flujo completo

| Escenario | Resultado |
|-----------|-----------|
| Login con Google via Auth0 | ✅ |
| Registro automático en primer login | ✅ |
| Ver feed sin autenticación | ✅ |
| Crear post (menor a 140 chars) | ✅ |
| Crear post (mayor a 140 chars) | ✅ Bloqueado en frontend y backend |
| Eliminar post propio | ✅ |
| Intentar eliminar post ajeno | ✅ Backend responde 403 |
| Ver perfil `/api/me` con datos reales | ✅ |
| Logout y verificar que el feed sigue visible | ✅ |
| Probar endpoints con Swagger UI + JWT Bearer | ✅ |

---

## Seguridad

- Los tokens JWT son emitidos y firmados por Auth0 con algoritmo **RS256**
- El backend valida la firma usando el JWKS público de Auth0 sin almacenar claves privadas
- Se valida el `audience` del token para asegurar que pertenece a esta API específica
- El campo `sub` del JWT vincula el token con el usuario en la BD — nunca se almacenan contraseñas
- Las sesiones son **stateless** — no hay cookies ni estado en servidor
- CORS configurado para permitir solo los orígenes del frontend
- Los secretos de Auth0 nunca se commitean al repositorio (cubiertos por `.gitignore`)

---

## Despliegue

- **Frontend**: Amazon S3 static website — ver instrucciones en `frontend/README.md`
- **Microservicios**: AWS Lambda + API Gateway — Parte 5

---

## Equipo

Proyecto desarrollado por Karol Estefany Estupiñan Viancha y Julian David Castiblanco Real para TDSE — ECI 2026.