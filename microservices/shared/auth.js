// shared/auth.js — Validador JWT compartido entre los 3 microservicios
// Verifica tokens de Auth0 usando JWKS (sin librería pesada, solo jose)

const { createRemoteJWKSet, jwtVerify } = require('jose');

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

let jwks = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`)
    );
  }
  return jwks;
}

/**
 * Extrae y valida el JWT del header Authorization.
 * Retorna el payload del token si es válido, o null si no hay token.
 * Lanza un error si el token existe pero es inválido.
 */
async function verifyToken(event) {
  const authHeader =
    event.headers?.Authorization || event.headers?.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return null; // Sin token — endpoints públicos lo permiten
  }

  const token = authHeader.slice(7);

  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: `https://${AUTH0_DOMAIN}/`,
    audience: AUTH0_AUDIENCE,
  });

  return payload;
}

/**
 * Respuesta estándar de error de autenticación
 */
function unauthorizedResponse(message = 'Token inválido o ausente') {
  return {
    statusCode: 401,
    headers: corsHeaders(),
    body: JSON.stringify({ error: 'Unauthorized', message }),
  };
}

function forbiddenResponse(message = 'No tienes permiso para esta acción') {
  return {
    statusCode: 403,
    headers: corsHeaders(),
    body: JSON.stringify({ error: 'Forbidden', message }),
  };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };
}

module.exports = { verifyToken, unauthorizedResponse, forbiddenResponse, corsHeaders };