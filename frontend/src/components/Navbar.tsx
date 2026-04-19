import { useAuth0 } from '@auth0/auth0-react';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, loginWithRedirect, logout, user, isLoading } = useAuth0();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">◆</span>
        <span className="brand-name">twitterclone</span>
      </div>

      <div className="navbar-actions">
        {isLoading ? (
          <div className="spinner-sm" />
        ) : isAuthenticated ? (
          <div className="user-section">
            {user?.picture && (
              <img src={user.picture} alt={user.name ?? ''} className="avatar avatar-sm" />
            )}
            <span className="username-display">{user?.nickname}</span>
            <button
              className="btn btn-ghost"
              onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
              }
            >
              Salir
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => loginWithRedirect()}>
            Iniciar sesión
          </button>
        )}
      </div>
    </nav>
  );
}
