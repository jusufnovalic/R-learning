import { useState, useRef, useEffect } from 'react';
import './Quizz.css';
 
// ── Placeholder baza igrača (zamijeni sa pravom bazom kada bude sprema) ──────
export const PLAYERS_DB = [
  { id: 1,  ime: 'Adnan Kovačević',   inicijali: 'AK', rang: 'Pro',     boja: '#7c3aed', tokeni: 340 },
  { id: 2,  ime: 'Belma Sarajlić',    inicijali: 'BS', rang: 'Expert',  boja: '#e8622a', tokeni: 280 },
  { id: 3,  ime: 'Dino Hadžić',       inicijali: 'DH', rang: 'Starter', boja: '#0ea5e9', tokeni: 120 },
  { id: 4,  ime: 'Emina Tursić',      inicijali: 'ET', rang: 'Pro',     boja: '#16a34a', tokeni: 410 },
  { id: 5,  ime: 'Faruk Mulalic',     inicijali: 'FM', rang: 'Expert',  boja: '#db2777', tokeni: 195 },
  { id: 6,  ime: 'Gorana Begić',      inicijali: 'GB', rang: 'Starter', boja: '#d97706', tokeni: 90  },
  { id: 7,  ime: 'Haris Skopljak',    inicijali: 'HS', rang: 'Legend',  boja: '#6366f1', tokeni: 620 },
  { id: 8,  ime: 'Ilvana Mujić',      inicijali: 'IM', rang: 'Pro',     boja: '#14b8a6', tokeni: 370 },
  { id: 9,  ime: 'Jasmin Bajrić',     inicijali: 'JB', rang: 'Expert',  boja: '#f43f5e', tokeni: 240 },
  { id: 10, ime: 'Kenan Škrijelj',    inicijali: 'KŠ', rang: 'Legend',  boja: '#8b5cf6', tokeni: 580 },
  { id: 11, ime: 'Lejla Isaković',    inicijali: 'LI', rang: 'Starter', boja: '#10b981', tokeni: 75  },
  { id: 12, ime: 'Mirza Suljić',      inicijali: 'MS', rang: 'Pro',     boja: '#f59e0b', tokeni: 330 },
  { id: 13, ime: 'Naida Purkovic',    inicijali: 'NP', rang: 'Expert',  boja: '#3b82f6', tokeni: 210 },
  { id: 14, ime: 'Omar Čaušević',     inicijali: 'OČ', rang: 'Starter', boja: '#ec4899', tokeni: 60  },
  { id: 15, ime: 'Petra Filipović',   inicijali: 'PF', rang: 'Pro',     boja: '#22c55e', tokeni: 395 },
];
 
const TOKEN_COST = 10;
const INITIAL_TOKENS = 150;
 
// ── Token coin komponenta ─────────────────────────────────────────────────────
function TokenCoin({ tokens, spending }) {
  return (
    <div className={`quizz-token ${spending ? 'quizz-token--spending' : ''}`}>
      <div className="quizz-token__coin">🪙</div>
      <div className="quizz-token__info">
        <span className="quizz-token__amount">{tokens}</span>
        <span className="quizz-token__label">Tokeni</span>
      </div>
    </div>
  );
}
 
// ── Toast notifikacija ────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`quizz-toast quizz-toast--${toast.tip}`}>
      <span>{toast.ikona}</span>
      {toast.poruka}
    </div>
  );
}
 
// ── Dropdown item ─────────────────────────────────────────────────────────────
function PlayerDropdownItem({ player, onSelect }) {
  return (
    <div className="challenge-card__dropdown-item" onClick={() => onSelect(player)}>
      <div
        className="challenge-card__dropdown-avatar"
        style={{ background: player.boja }}
      >
        {player.inicijali}
      </div>
      <div>
        <div className="challenge-card__dropdown-name">{player.ime}</div>
        <div className="challenge-card__dropdown-rank">
          {player.rang} · 🪙 {player.tokeni}
        </div>
      </div>
    </div>
  );
}
 
// ── Glavni Quizz page ─────────────────────────────────────────────────────────
export default function Quizz() {
  const [tokens, setTokens]               = useState(INITIAL_TOKENS);
  const [spending, setSpending]           = useState(false);
  const [query, setQuery]                 = useState('');
  const [showDropdown, setShowDropdown]   = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [toast, setToast]                 = useState(null);
  const [recentChallenges, setRecentChallenges] = useState([]);
  const inputRef  = useRef(null);
  const wrapRef   = useRef(null);
 
  // Filtrirani igrači iz baze
  const filtered = query.trim().length > 0
    ? PLAYERS_DB.filter(p =>
        p.ime.toLowerCase().includes(query.toLowerCase()) &&
        p.id !== 0 // exclude self (placeholder)
      ).slice(0, 6)
    : [];
 
  // Zatvori dropdown klikom vana
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
 
  // Sakrij toast nakon 3s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);
 
  function showToast(poruka, tip = 'success', ikona = '✅') {
    setToast({ poruka, tip, ikona });
  }
 
  function handleSelectPlayer(player) {
    setSelectedPlayer(player);
    setQuery('');
    setShowDropdown(false);
  }
 
  function handleClearPlayer() {
    setSelectedPlayer(null);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }
 
  function handleChallenge() {
    if (!selectedPlayer) return;
 
    // Provjeri tokene
    if (tokens < TOKEN_COST) {
      showToast(`Nemaš dovoljno tokena! Potrebno: ${TOKEN_COST} 🪙`, 'error', '❌');
      return;
    }
 
    // Animacija trošenja tokena
    setSpending(true);
    setTimeout(() => setSpending(false), 600);
 
    // Skini tokene
    setTokens(t => t - TOKEN_COST);
 
    // Dodaj u historiju izazova
    const now = new Date();
    const timeStr = now.toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' });
    setRecentChallenges(prev => [
      {
        id: Date.now(),
        player: selectedPlayer,
        time: timeStr,
        status: 'Čeka odgovor',
      },
      ...prev.slice(0, 4), // max 5 u historiji
    ]);
 
    // Toast potvrde
    showToast(
      `Izazov poslan ${selectedPlayer.ime}! -${TOKEN_COST} tokena`,
      'success',
      '⚔️'
    );
 
    // Reset forme
    setSelectedPlayer(null);
    setQuery('');
  }
 
  const canChallenge = selectedPlayer && tokens >= TOKEN_COST;
 
  return (
    <div className="quizz-page">
 
      {/* ── Header ── */}
      <div className="quizz-header">
        <div className="quizz-header__left">
          <h1 className="quizz-header__title">Quizz ⚔️</h1>
          <TokenCoin tokens={tokens} spending={spending} />
        </div>
        <div className="quizz-header__right">
          <button className="quizz-header__bell">🔔</button>
          <div className="quizz-header__avatar">JN</div>
        </div>
      </div>
 
      {/* ── Body ── */}
      <div className="quizz-body">
        <p className="quizz-body__label">Quizz — Dueli</p>
 
        {/* ── Challenge card ── */}
        <div className="challenge-card">
          <div className="challenge-card__icon">⚔️</div>
          <h2 className="challenge-card__title">Izazovi Prijatelja</h2>
          <p className="challenge-card__subtitle">
            Pronađi kolegu i pošalji mu izazov na duel.<br />
            Pobjednik osvaja poene na ljestvici.
          </p>
 
          {/* Search / selected */}
          {selectedPlayer ? (
            <div className="challenge-card__selected">
              <div
                className="challenge-card__selected-avatar"
                style={{ background: selectedPlayer.boja }}
              >
                {selectedPlayer.inicijali}
              </div>
              <div>
                <div className="challenge-card__selected-name">{selectedPlayer.ime}</div>
                <div className="challenge-card__selected-rank">
                  {selectedPlayer.rang} · 🪙 {selectedPlayer.tokeni} tokena
                </div>
              </div>
              <button
                className="challenge-card__selected-clear"
                onClick={handleClearPlayer}
                title="Promijeni igrača"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="challenge-card__search-wrap" ref={wrapRef}>
              <span className="challenge-card__search-icon">🔍</span>
              <input
                ref={inputRef}
                className="challenge-card__input"
                type="text"
                placeholder="Pretraži igrača po imenu..."
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => query.length > 0 && setShowDropdown(true)}
              />
 
              {showDropdown && query.length > 0 && (
                <div className="challenge-card__dropdown">
                  {filtered.length > 0 ? (
                    filtered.map(p => (
                      <PlayerDropdownItem
                        key={p.id}
                        player={p}
                        onSelect={handleSelectPlayer}
                      />
                    ))
                  ) : (
                    <div className="challenge-card__dropdown-empty">
                      Nema pronađenih igrača 🔍
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
 
          {/* Token cost */}
          <div className="challenge-card__cost">
            <span className="challenge-card__cost-coin">🪙</span>
            Izazov košta <strong>{TOKEN_COST} tokena</strong>
            &nbsp;· Imaš <strong>{tokens}</strong>
          </div>
 
          {/* Challenge button */}
          <button
            className="btn-challenge"
            disabled={!canChallenge}
            onClick={handleChallenge}
          >
            ⚔️ Izazovi
            {selectedPlayer ? ` ${selectedPlayer.ime.split(' ')[0]}` : ''}
          </button>
 
          {/* Warning ako nema tokena */}
          {tokens < TOKEN_COST && (
            <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 700, textAlign: 'center' }}>
              ❌ Nemaš dovoljno tokena za izazov!
            </p>
          )}
        </div>
 
        {/* ── Historija izazova ── */}
        {recentChallenges.length > 0 && (
          <div className="recent-challenges">
            <div className="recent-challenges__title">Poslani izazovi</div>
            <div className="recent-challenges__list">
              {recentChallenges.map(c => (
                <div key={c.id} className="recent-challenge-item">
                  <div
                    className="recent-challenge-item__avatar"
                    style={{ background: c.player.boja }}
                  >
                    {c.player.inicijali}
                  </div>
                  <div className="recent-challenge-item__info">
                    <div className="recent-challenge-item__name">{c.player.ime}</div>
                    <div className="recent-challenge-item__time">Poslano u {c.time}</div>
                  </div>
                  <div className="recent-challenge-item__cost">
                    🪙 -{TOKEN_COST}
                  </div>
                  <div className="recent-challenge-item__status recent-challenge-item__status--pending">
                    {c.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
 
      {/* ── Toast ── */}
      <Toast toast={toast} />
    </div>
  );
}
