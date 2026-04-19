// ── Entidades del dominio ────────────────────────────────────────────────────

export interface Author {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  postCount: number;
}

// ── Respuestas paginadas de Spring ───────────────────────────────────────────

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  last: boolean;
  first: boolean;
}

// ── Requests ─────────────────────────────────────────────────────────────────

export interface CreatePostRequest {
  content: string;
}

export interface UpdateProfileRequest {
  username?: string;
  avatarUrl?: string;
}
