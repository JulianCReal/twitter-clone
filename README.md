# TwitterClone

Aplicación tipo Twitter que permite a usuarios autenticados publicar posts de hasta 140 caracteres en un feed público global. Desarrollado como proyecto académico para la asignatura **Transformación Digital y Soluciones Empresariales (TDSE)** — Escuela Colombiana de Ingeniería Julio Garavito.

---

## Descripción del proyecto

TwitterClone permite a cualquier visitante ver el feed público de posts sin necesidad de autenticarse. Los usuarios que inician sesión con Auth0 pueden crear posts de hasta 140 caracteres y eliminar sus propios posts. El sistema registra automáticamente al usuario en la primera sesión usando los datos del token JWT.

---

## 🌐 Links del proyecto

| Recurso | URL |
|---------|-----|
| **Frontend (producción)** | https://d25wl9z0bnjvbw.cloudfront.net |
| **API Gateway (microservicios)** | https://fmmdr7u2wf.execute-api.us-east-1.amazonaws.com/prod |
| **Repositorio GitHub** | https://github.com/JulianCReal/twitter-clone |
| **Swagger UI (local)** | http://localhost:8080/swagger-ui.html |

> El Swagger UI del monolito corre localmente. Ver sección [Ejecutar el backend](#3-ejecutar-el-backend) para instrucciones. Se incluye captura de pantalla en la sección de pruebas.

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
│              FASE 2 — MICROSERVICIOS AWS                    │
│                                                             │
│   [React/TS Frontend — CloudFront + S3]                     │
│         │                                                   │
│         ▼                                                   │
│   [AWS API Gateway]                                         │
│     ┌───┼───────┐                                           │
│     ▼   ▼       ▼                                           │
│  [λ User] [λ Posts] [λ Stream]   ← AWS Lambda (Node.js)    │
│         │                                                   │
│   [Auth0 JWT]       [AWS RDS PostgreSQL]                    │
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

### Infraestructura de despliegue

```
Internet
   │
   ▼
[CloudFront HTTPS]  ←── d25wl9z0bnjvbw.cloudfront.net
   │
   ▼
[S3 Static Website]  ←── twitter-clone-frontend-tdse-1
   │ (React build)
   │
   ├──→ [Auth0]  ←── autenticación SPA
   │
   └──→ [API Gateway]  ←── fmmdr7u2wf.execute-api.us-east-1.amazonaws.com/prod
              │
              ├── /api/users/*   → Lambda user-service
              ├── /api/posts/*   → Lambda posts-service
              └── /api/stream    → Lambda stream-service
                        │
                        └── [RDS PostgreSQL]
```

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + TypeScript | 18.3 / 5.5 |
| Auth (frontend) | Auth0 React SDK | 2.2.4 |
| HTTP client | Axios | 1.7 |
| Backend (monolito) | Spring Boot | 3.2.5 |
| Lenguaje backend | Java | 21 |
| Seguridad | Spring Security OAuth2 Resource Server | 6.2 |
| Proveedor de identidad | Auth0 (RS256 JWT) | — |
| Base de datos (dev) | H2 (archivo local) | — |
| Base de datos (prod) | PostgreSQL (AWS RDS) | — |
| Documentación API | SpringDoc OpenAPI / Swagger UI | 2.5 |
| Microservicios | AWS Lambda (Node.js 20) | — |
| API Gateway | AWS API Gateway (REST) | — |
| Hosting frontend | Amazon S3 + CloudFront | — |

---

## Estructura del repositorio

```
twitter-clone/
├── .gitignore
├── README.md
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
│
├── frontend/                     ← App React + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── types.ts
│       ├── auth0-config.ts
│       ├── App.tsx
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
└── microservices/                ← AWS Lambda (Node.js)
    ├── user-service/
    │   ├── handler.js
    │   └── shared/
    ├── posts-service/
    │   ├── handler.js
    │   └── shared/
    └── stream-service/
        ├── handler.js
        └── shared/
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
git clone https://github.com/JulianCReal/twitter-clone.git
cd twitter-clone
```

### 2. Configurar Auth0

#### Crear la SPA Application
1. Dashboard → **Applications** → **Create Application**
2. Nombre: `TwitterClone Frontend`, tipo: **Single Page Application**
3. Pestaña Settings → configurar URLs:

```
Allowed Callback URLs:  http://localhost:3000, https://d25wl9z0bnjvbw.cloudfront.net
Allowed Logout URLs:    http://localhost:3000, https://d25wl9z0bnjvbw.cloudfront.net
Allowed Web Origins:    http://localhost:3000, https://d25wl9z0bnjvbw.cloudfront.net
```

#### Crear la API
1. Dashboard → **APIs** → **Create API**
2. Nombre: `TwitterClone API`
3. Identifier (Audience): `https://api.twitterclone.com`
4. Algorithm: **RS256**

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

Edita `backend/src/main/resources/application.yml`:

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
| `http://localhost:8080/swagger-ui.html` | Documentación Swagger UI |
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
| Frontend accesible vía HTTPS (CloudFront) | ✅ |
| CORS correcto entre CloudFront y API Gateway | ✅ |

---

## Seguridad

- Los tokens JWT son emitidos y firmados por Auth0 con algoritmo **RS256**
- El backend valida la firma usando el JWKS público de Auth0 sin almacenar claves privadas
- Se valida el `audience` del token para asegurar que pertenece a esta API específica
- El campo `sub` del JWT vincula el token con el usuario en la BD — nunca se almacenan contraseñas
- Las sesiones son **stateless** — no hay cookies ni estado en servidor
- CORS configurado en las Lambdas mediante la variable `ALLOWED_ORIGIN` para permitir solo el origen de CloudFront
- El frontend se sirve sobre HTTPS mediante CloudFront — requerido por Auth0 SPA SDK
- Los secretos de Auth0 nunca se commitean al repositorio (cubiertos por `.gitignore`)

---

## Despliegue

### Frontend (Amazon S3 + CloudFront)

```bash
cd frontend
npm run build
aws s3 sync build/ s3://twitter-clone-frontend-tdse-1 --delete
```

> CloudFront distribuye el contenido con HTTPS desde `https://d25wl9z0bnjvbw.cloudfront.net`.  
> Nota: CloudFront en AWS Academy (Learner Lab) requiere la consola web — los permisos CLI de `cloudfront:*` están restringidos.

### Microservicios (AWS Lambda)

Cada Lambda se despliega manualmente desde la consola AWS con las siguientes variables de entorno:

| Variable | Descripción |
|----------|-------------|
| `AUTH0_DOMAIN` | Dominio del tenant Auth0 |
| `AUTH0_AUDIENCE` | Audience de la API Auth0 |
| `DATABASE_URL` | Connection string de RDS PostgreSQL |
| `ALLOWED_ORIGIN` | `https://d25wl9z0bnjvbw.cloudfront.net` |

---

## Equipo

Proyecto desarrollado por **Julian David Castiblanco Real** y **Karol Estefany Estupiñan Viancha** para TDSE — Escuela Colombiana de Ingeniería Julio Garavito, 2026.
