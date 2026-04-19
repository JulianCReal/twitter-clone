-- Schema para TwitterClone en PostgreSQL / AWS RDS
-- Ejecutar una sola vez al crear la base de datos

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth0_id   VARCHAR(255) NOT NULL UNIQUE,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    email      VARCHAR(255) NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS streams (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(50)  NOT NULL UNIQUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content    VARCHAR(140) NOT NULL,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stream_id  UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_posts_stream_id    ON posts(stream_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id      ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at   ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_auth0_id     ON users(auth0_id);

-- Stream público global (debe existir siempre)
INSERT INTO streams (name) VALUES ('public')
ON CONFLICT (name) DO NOTHING;