import { useState, FormEvent } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '../hooks/useApi';
import { Post } from '../types';
import './PostForm.css';

const MAX_CHARS = 140;

interface Props {
  onPostCreated?: (post: Post) => void;
}

export default function PostForm({ onPostCreated }: Props) {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const { createPost } = useApi();

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_CHARS - content.length;
  const isOverLimit = remaining < 0;
  const isEmpty = content.trim().length === 0;
  const fillPct = Math.min(content.length / MAX_CHARS, 1);
  const circumference = 2 * Math.PI * 15; // r=15 => ~94.25

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isEmpty || isOverLimit) return;

    setLoading(true);
    setError(null);
    try {
      const res = await createPost({ content: content.trim() });
      setContent('');
      onPostCreated?.(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Error al publicar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="post-form-card post-form-guest">
        <p>Inicia sesión para publicar en el feed.</p>
        <button className="btn btn-primary" onClick={() => loginWithRedirect()}>
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <form className="post-form-card" onSubmit={handleSubmit}>
      <textarea
        className="post-textarea"
        placeholder="¿Qué estás pensando?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        disabled={loading}
      />

      <div className="post-form-footer">
        <div className="char-info">
          <div className={`char-ring ${remaining < 20 ? 'warning' : ''} ${isOverLimit ? 'danger' : ''}`}>
            <svg viewBox="0 0 36 36" className="ring-svg">
              <circle cx="18" cy="18" r="15" className="ring-bg" />
              <circle
                cx="18" cy="18" r="15"
                className="ring-fill"
                strokeDasharray={`${fillPct * circumference} ${circumference}`}
                transform="rotate(-90 18 18)"
              />
            </svg>
          </div>
          {remaining < 20 && (
            <span className={`char-count ${isOverLimit ? 'danger' : 'warning'}`}>
              {remaining}
            </span>
          )}
        </div>

        {error && <span className="form-error">{error}</span>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || isEmpty || isOverLimit}
        >
          {loading ? <span className="spinner-sm" /> : 'Publicar'}
        </button>
      </div>
    </form>
  );
}
