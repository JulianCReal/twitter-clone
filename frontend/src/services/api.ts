import axios, { AxiosInstance } from 'axios';
import { Post, UserProfile, Page, CreatePostRequest, UpdateProfileRequest } from '../types';

const BASE_URL = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:8080';

// Cliente público — sin autenticación
export const publicApi: AxiosInstance = axios.create({ baseURL: BASE_URL });

// Cliente autenticado — inyecta JWT en cada request
const createAuthApi = (token: string): AxiosInstance =>
  axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

// ── Endpoints públicos ────────────────────────────────────────────────────────

export const getStream = (page = 0, size = 20) =>
  publicApi.get<Page<Post>>(`/api/stream?page=${page}&size=${size}`);

export const getPostById = (id: string) =>
  publicApi.get<Post>(`/api/posts/${id}`);

// ── Endpoints protegidos ──────────────────────────────────────────────────────

export const createPost = (token: string, body: CreatePostRequest) =>
  createAuthApi(token).post<Post>('/api/posts', body);

export const deletePost = (token: string, id: string) =>
  createAuthApi(token).delete<void>(`/api/posts/${id}`);

export const getMe = (token: string) =>
  createAuthApi(token).get<UserProfile>('/api/me');

export const updateMe = (token: string, body: UpdateProfileRequest) =>
  createAuthApi(token).put<UserProfile>('/api/me', body);
