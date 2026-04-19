import { useState } from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { auth0Config } from './auth0-config';
import { Post } from './types';
import Navbar from './components/Navbar';
import PostForm from './components/PostForm';
import Feed from './components/Feed';
import UserProfile from './components/UserProfile';
import './App.css';

function AppContent() {
  const [latestPost, setLatestPost] = useState<Post | null>(null);

  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <div className="main-column">
          <header className="feed-header">
            <h1 className="feed-title">Feed público</h1>
            <span className="feed-subtitle">Lo que está pasando</span>
          </header>
          <PostForm onPostCreated={setLatestPost} />
          <div className="feed-divider" />
          <Feed newPost={latestPost} />
        </div>
        <aside className="side-column">
          <UserProfile />
        </aside>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Auth0Provider {...auth0Config}>
      <AppContent />
    </Auth0Provider>
  );
}
