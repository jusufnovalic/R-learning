import { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
// import Overview from './components/pages/Overview';
import Flashcards from './components/pages/Flashcards';
import Lectures from './components/pages/Lectures';
import LandingPage from './components/pages/LandingPage';
import Quizz from './components/pages/Quizz';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activePage, setActivePage] = useState('Lectures');

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  function renderPage() {
    switch (activePage) {
      case 'Flashcards':
        return <Flashcards />;
      case 'Lectures':
        return <Lectures />;
        case 'Quizz':
        return <Quizz />;
      default:
        return (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
            color: '#a1a1aa',
            background: '#f7f8f8',
            minHeight: '100vh',
          }}>
            <span style={{ fontSize: 52 }}>🚧</span>
            <p style={{ fontSize: 18, fontWeight: 700 }}>{activePage} — Coming Soon</p>
            <p style={{ fontSize: 13, color: '#d1d5db' }}>Ova stranica je u izradi</p>
          </div>
        );
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {renderPage()}
      </div>
    </div>
  );
}
