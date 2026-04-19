import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '../hooks/useApi';
import { UserProfile as UserProfileType } from '../types';
import './UserProfile.css';

function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  // Epoch 0 o fechas inválidas → mostrar guión
  if (isNaN(date.getTime()) || date.getFullYear() < 2000) return '—';
  return date.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
}

export default function UserProfile() {
  const { isAuthenticated } = useAuth0();
  const { getMe } = useApi();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    getMe()
      .then((res) => setProfile(res.data))
      .catch(() => setError('No se pudo cargar el perfil.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  if (loading) return <div className="profile-card skeleton" />;
  if (error) return <div className="profile-card profile-error">{error}</div>;
  if (!profile) return null;

  return (
    <aside className="profile-card">
      <div className="profile-header">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.username}
            className="avatar avatar-lg"
          />
        ) : (
          <div className="avatar-placeholder-lg">
            {profile.username.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="profile-info">
          <span className="profile-username">@{profile.username}</span>
          <span className="profile-email">{profile.email}</span>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat">
          <span className="stat-value">{profile.postCount}</span>
          <span className="stat-label">posts</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatDate(profile.createdAt)}</span>
          <span className="stat-label">miembro desde</span>
        </div>
      </div>
    </aside>
  );
}