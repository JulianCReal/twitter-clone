import { useState, useEffect, useCallback } from 'react';
import { getStream } from '../services/api';
import { Post } from '../types';
import PostCard from './PostCard';
import './Feed.css';

interface Props {
  newPost?: Post | null;
}

export default function Feed({ newPost }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStream(pageNum, 20);
      const { content, last } = res.data;
      setPosts((prev) => (append ? [...prev, ...content] : content));
      setHasMore(!last);
    } catch {
      setError('No se pudo cargar el feed. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(0, false); }, [fetchPosts]);

  useEffect(() => {
    if (newPost) setPosts((prev) => [newPost, ...prev]);
  }, [newPost]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, true);
  };

  const handleDeleted = (id: string) =>
    setPosts((prev) => prev.filter((p) => p.id !== id));

  if (error) {
    return (
      <div className="feed-message feed-error">
        <span>⚠</span> {error}
        <button className="btn btn-ghost" onClick={() => fetchPosts(0, false)}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <section className="feed">
      {posts.length === 0 && !loading && (
        <div className="feed-message feed-empty">
          <span className="empty-icon">◇</span>
          <p>El feed está vacío.</p>
          <p className="feed-hint">¡Sé el primero en publicar!</p>
        </div>
      )}

      <div className="posts-list">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
        ))}
      </div>

      {loading && <div className="feed-loading"><div className="spinner" /></div>}

      {!loading && hasMore && posts.length > 0 && (
        <button className="btn btn-ghost load-more" onClick={handleLoadMore}>
          Cargar más
        </button>
      )}
    </section>
  );
}
