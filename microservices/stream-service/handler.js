'use strict';

const { corsHeaders } = require('../shared/auth');
const { query } = require('../shared/db');

/**
 * stream-service — Endpoints públicos de lectura
 * Rutas configuradas en API Gateway:
 *   GET /api/stream        → feed público paginado
 *   GET /api/posts         → todos los posts paginados
 *   GET /api/posts/{id}    → un post específico
 *   GET /api/users/{id}    → perfil público de un usuario
 *
 * Ninguno requiere autenticación.
 */
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  try {
    const path   = event.path || '';
    const method = event.httpMethod;
    const params = event.pathParameters || {};
    const qs     = event.queryStringParameters || {};

    if (method !== 'GET') {
      return {
        statusCode: 405,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    // GET /api/stream
    if (path === '/api/stream' || path.endsWith('/stream')) {
      return await getPublicStream(qs);
    }

    // GET /api/posts/{id}
    if (params.id && path.includes('/posts/')) {
      return await getPostById(params.id);
    }

    // GET /api/posts
    if (path === '/api/posts' || path.endsWith('/posts')) {
      return await getAllPosts(qs);
    }

    // GET /api/users/{id}
    if (params.id && path.includes('/users/')) {
      return await getUserById(params.id);
    }

    return {
      statusCode: 404,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Ruta no encontrada' }),
    };
  } catch (err) {
    console.error('stream-service error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// ── Handlers ──────────────────────────────────────────────────────────────────

async function getPublicStream(qs) {
  const page = Math.max(0, parseInt(qs.page || '0'));
  const size = Math.min(50, Math.max(1, parseInt(qs.size || '20')));
  const offset = page * size;

  const streamResult = await query(
    "SELECT id FROM streams WHERE name = 'public' LIMIT 1"
  );

  if (streamResult.rows.length === 0) {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(emptyPage(page, size)),
    };
  }

  const streamId = streamResult.rows[0].id;

  const [postsResult, countResult] = await Promise.all([
    query(
      `SELECT p.*, u.username, u.avatar_url
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.stream_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [streamId, size, offset]
    ),
    query(
      'SELECT COUNT(*) as total FROM posts WHERE stream_id = $1',
      [streamId]
    ),
  ]);

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(toPage(postsResult.rows, countResult.rows[0].total, page, size)),
  };
}

async function getAllPosts(qs) {
  const page = Math.max(0, parseInt(qs.page || '0'));
  const size = Math.min(50, Math.max(1, parseInt(qs.size || '20')));
  const offset = page * size;

  const [postsResult, countResult] = await Promise.all([
    query(
      `SELECT p.*, u.username, u.avatar_url
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [size, offset]
    ),
    query('SELECT COUNT(*) as total FROM posts'),
  ]);

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(toPage(postsResult.rows, countResult.rows[0].total, page, size)),
  };
}

async function getPostById(postId) {
  const result = await query(
    `SELECT p.*, u.username, u.avatar_url
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = $1`,
    [postId]
  );

  if (result.rows.length === 0) {
    return {
      statusCode: 404,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Post no encontrado' }),
    };
  }

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(toPostResponse(result.rows[0])),
  };
}

async function getUserById(userId) {
  const [userResult, countResult] = await Promise.all([
    query('SELECT * FROM users WHERE id = $1', [userId]),
    query('SELECT COUNT(*) as count FROM posts WHERE user_id = $1', [userId]),
  ]);

  if (userResult.rows.length === 0) {
    return {
      statusCode: 404,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Usuario no encontrado' }),
    };
  }

  const user = userResult.rows[0];
  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({
      id:        user.id,
      username:  user.username,
      email:     user.email,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      postCount: parseInt(countResult.rows[0].count),
    }),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toPostResponse(row) {
  return {
    id:        row.id,
    content:   row.content,
    createdAt: row.created_at,
    author: {
      id:        row.user_id,
      username:  row.username,
      avatarUrl: row.avatar_url,
    },
  };
}

function toPage(rows, total, page, size) {
  const totalElements = parseInt(total);
  const totalPages    = Math.ceil(totalElements / size);
  return {
    content:       rows.map(toPostResponse),
    totalElements,
    totalPages,
    number:        page,
    size,
    first:         page === 0,
    last:          page >= totalPages - 1,
  };
}

function emptyPage(page, size) {
  return {
    content: [], totalElements: 0, totalPages: 0,
    number: page, size, first: true, last: true,
  };
}