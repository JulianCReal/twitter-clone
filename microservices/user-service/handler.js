'use strict';

const { verifyToken, unauthorizedResponse, corsHeaders } = require('./shared/auth');
const { query } = require('./shared/db');

/**
 * user-service — Maneja GET /api/me y PUT /api/me
 * Rutas configuradas en API Gateway:
 *   GET  /api/me  → esta Lambda
 *   PUT  /api/me  → esta Lambda
 */
exports.handler = async (event) => {
  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  try {
    const payload = await verifyToken(event);
    if (!payload) return unauthorizedResponse();

    const method = event.httpMethod;

    if (method === 'GET') return await getMyProfile(payload);
    if (method === 'PUT') return await updateMyProfile(payload, event);

    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (err) {
    console.error('user-service error:', err);

    if (err.code === 'ERR_JWT_EXPIRED' || err.code === 'ERR_JWS_INVALID') {
      return unauthorizedResponse('Token expirado o inválido');
    }

    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// ── Handlers ──────────────────────────────────────────────────────────────────

async function getMyProfile(jwtPayload) {
  const auth0Id = jwtPayload.sub;

  // Buscar o crear usuario (registro automático en primer login)
  let user = await findUserByAuth0Id(auth0Id);

  if (!user) {
    user = await createUserFromJwt(jwtPayload);
  }

  const postCount = await countUserPosts(user.id);

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(toUserResponse(user, postCount)),
  };
}

async function updateMyProfile(jwtPayload, event) {
  const auth0Id = jwtPayload.sub;
  const user = await findUserByAuth0Id(auth0Id);
  if (!user) return unauthorizedResponse('Usuario no encontrado');

  const body = JSON.parse(event.body || '{}');
  const { username, avatarUrl } = body;

  if (username) {
    const existing = await query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, user.id]
    );
    if (existing.rows.length > 0) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: `El username '${username}' ya está en uso` }),
      };
    }
  }

  const result = await query(
    `UPDATE users
     SET username   = COALESCE($1, username),
         avatar_url = COALESCE($2, avatar_url)
     WHERE id = $3
     RETURNING *`,
    [username || null, avatarUrl || null, user.id]
  );

  const postCount = await countUserPosts(user.id);

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(toUserResponse(result.rows[0], postCount)),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function findUserByAuth0Id(auth0Id) {
  const result = await query(
    'SELECT * FROM users WHERE auth0_id = $1',
    [auth0Id]
  );
  return result.rows[0] || null;
}

async function createUserFromJwt(payload) {
  const auth0Id  = payload.sub;
  const nickname = payload.nickname;
  const email    = payload.email;
  const picture  = payload.picture;

  // Construir username base de forma segura
  let base = nickname || (email ? email.split('@')[0] : null) || auth0Id.split('|').pop();
  base = base.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().substring(0, 40) || 'user';

  // Asegurar unicidad
  let username = base;
  let suffix = 1;
  while (true) {
    const exists = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (exists.rows.length === 0) break;
    username = `${base}${suffix++}`;
  }

  const safeEmail = email || `${auth0Id.replace(/[^a-zA-Z0-9]/g, '_')}@placeholder.com`;

  const result = await query(
    `INSERT INTO users (auth0_id, username, email, avatar_url, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [auth0Id, username, safeEmail, picture || null]
  );

  return result.rows[0];
}

async function countUserPosts(userId) {
  const result = await query(
    'SELECT COUNT(*) as count FROM posts WHERE user_id = $1',
    [userId]
  );
  return parseInt(result.rows[0].count);
}

function toUserResponse(user, postCount) {
  return {
    id:        user.id,
    username:  user.username,
    email:     user.email,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
    postCount,
  };
}