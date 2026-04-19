import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '../hooks/useApi';
import { Post } from '../types';
import './PostCard.css';

function timeAgo(isoDate: string): string {
  const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(isoDate).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  });
}

function getInitials(username?: string): string {
  return username ? username.slice(0, 2).toUpperCase() : '??';
}

interface Props {
  post: Post;
  onDeleted?: (id: string) => void;
}

export default function PostCard({ post, onDeleted }: Props) {
  const { user, isAuthenticated } = useAuth0();
  const { deletePost } = useApi();

  const isOwner = isAuthenticated && user?.nickname === post.author?.username;

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este post?')) return;
    try {
      await deletePost(post.id);
      onDeleted?.(post.id);
    } catch {
      alert('No se pudo eliminar el post.');
    }
  };

  return (
    <article className="post-card">
      <div className="post-avatar">
        {post.author?.avatarUrl ? (
          <img
            src={post.author.avatarUrl}
            alt={post.author.username}
            className="avatar"
          />
        ) : (
          <div className="avatar-placeholder">
            {getInitials(post.author?.username)}
          </div>
        )}
      </div>

      <div className="post-body">
        <div className="post-header">
          <span className="post-username">@{post.author?.username}</span>
          <span className="post-time">{timeAgo(post.createdAt)}</span>
          {isOwner && (
            <button
              className="btn-delete"
              onClick={handleDelete}
              title="Eliminar post"
            >
              ✕
            </button>
          )}
        </div>
        <p className="post-content">{post.content}</p>
      </div>
    </article>
  );
}
