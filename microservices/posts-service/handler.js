'use strict';

const {
  verifyToken,
  unauthorizedResponse,
  forbiddenResponse,
  corsHeaders,
} = require('./shared/auth');
const { query } = require('./shared/db');

/**
 * posts-service — Maneja POST /api/posts y DELETE /api/posts/{id}
 * Rutas configuradas en API Gateway:
 *   POST   /api/posts      → crear post (requiere JWT)
 *   DELETE /api/posts/{id} → eliminar post (requiere JWT + ser el autor)
 */
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  try {
    const method = event.httpMethod;
    const postId = event.pathParameters?.id;

    if (method === 'POST') {
      const payload = await verifyToken(event);
      if (!payload) return unauthorizedResponse();
      return await createPost(payload, event);
    }

    if (method === 'DELETE' && postId) {
      const payload = await verifyToken(event);
      if (!payload) return unauthorizedResponse();
      return await deletePost(payload, postId);
    }

    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (err) {
    console.error('posts-service error:', err);

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

async function createPost(jwtPayload, event) {
  const body = JSON.parse(event.body || '{}');
  const content = (body.content || '').trim();

  // Validaciones
  if (!content) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'El contenido no puede estar vacío' }),
    };
  }

  if (content.length > 140) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'El post no puede superar los 140 caracteres' }),
    };
  }

  // Buscar o crear usuario
  const user = await findOrCreateUser(jwtPayload);

  // Obtener el stream público
  const streamResult = await query(
    "SELECT id FROM streams WHERE name = 'public' LIMIT 1"
  );

  if (streamResult.rows.length === 0) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Stream público no encontrado' }),
    };
  }

  const streamId = streamResult.rows[0].id;

  // Crear el post
  const result = await query(
    `INSERT INTO posts (content, user_id, stream_id, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [content, user.id, streamId]
  );

  const post = result.rows[0];

  return {
    statusCode: 201,
    headers: corsHeaders(),
    body: JSON.stringify(toPostResponse(post, user)),
  };
}

async function deletePost(jwtPayload, postId) {
  // Verificar que el post existe
  const postResult = await query(
    'SELECT * FROM posts WHERE id = $1',
    [postId]
  );

  if (postResult.rows.length === 0) {
    return {
      statusCode: 404,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Post no encontrado' }),
    };
  }

  const post = postResult.rows[0];

  // Verificar que el usuario es el autor
  const user = await query(
    'SELECT * FROM users WHERE auth0_id = $1',
    [jwtPayload.sub]
  );

  if (user.rows.length === 0 || user.rows[0].id !== post.user_id) {
    return forbiddenResponse('Solo puedes eliminar tus propios posts');
  }

  await query('DELETE FROM posts WHERE id = $1', [postId]);

  return {
    statusCode: 204,
    headers: corsHeaders(),
    body: '',
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function findOrCreateUser(payload) {
  const auth0Id = payload.sub;
  const existing = await query(
    'SELECT * FROM users WHERE auth0_id = $1',
    [auth0Id]
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const nickname = payload.nickname;
  const email    = payload.email;
  const picture  = payload.picture;

  let base = nickname || (email ? email.split('@')[0] : null) || auth0Id.split('|').pop();
  base = base.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().substring(0, 40) || 'user';

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
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [auth0Id, username, safeEmail, picture || null]
  );
  return result.rows[0];
}

function toPostResponse(post, user) {
  return {
    id:        post.id,
    content:   post.content,
    createdAt: post.created_at,
    author: {
      id:        user.id,
      username:  user.username,
      avatarUrl: user.avatar_url,
    },
  };
}