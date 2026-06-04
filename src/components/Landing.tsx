'use client';
import { useRef, useState, useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import Image from 'next/image'; 
import type { AuthSession, ManagedUser } from '@/lib/auth';
import type { AuctionPhase } from '@/lib/types';
import { WC2026_PLAYERS } from '@/lib/wcSquads';
import Avatar from '@/components/ui/Avatar';
import WorldCupQuiz from '@/components/WorldCupQuiz';

interface RoomHistoryEntry {
  id: string;
  name: string;
  sport: string;
  phase: AuctionPhase;
  updatedAt: number;
}

interface LandingProps {
  userId: string;
  authSession: AuthSession | null;
  managedUsers: ManagedUser[];
  onStart: () => void;
  onJoin: (roomId: string, teamId: string, userName: string) => void;
  onLogin: (userId: string, password: string) => void;
  onLogout: () => void;
  onCreateUser: (userId: string, password: string) => void;
  onToggleUser: (userId: string) => void;
}

interface JoinRoomDetails {
  id: string;
  name: string;
  sport: string;
  tournament: string;
  budget: number;
  participants: Array<{
    id: string;
    name: string;
    color: string;
    ownerId: string | null;
  }>;
}

const FEATURES = [
  ['⚡', 'Live Bidding', '30s countdown — every bid adds +15 seconds, capped at 30s'],
  ['🔍', 'AI Player Scout', 'Search any player name or URL; AI fetches role, country & base price'],
  ['📁', 'Smart Upload', 'Import from Excel (.xlsx) — columns auto-detected'],
  ['📄', 'PDF Parsing', 'Upload a PDF squad list; AI extracts all players automatically'],
  ['🎨', 'Custom Teams', 'Set your team name and upload your own logo/photo'],
  ['🏟', 'Multi-Sport', 'IPL, UEFA, FIFA, NBA or any custom tournament'],
];

const overlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(5,7,14,0.85)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  overflowY: 'auto',
  zIndex: 1000,
  padding: 16,
};

const modalStyle: CSSProperties = {
  width: '100%',
  maxWidth: 480,
  margin: 'auto',
  background: 'var(--bg)',
  borderRadius: 16,
  animation: 'fadeUp 0.3s ease',
  border: '1px solid var(--bd2)',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  padding: 24,
};

// Unified classification tiers configuration
function calculateHybridTier(player: any): number {
  const team = (player.country || player.nationality || '').toLowerCase().trim();
  const position = (player.role || player.position || '').toLowerCase().trim();
  const mvTier = typeof player.tier === 'string' ? parseInt(player.tier.replace(/\D/g, '')) || 5 : (player.tier || 5);

  const tier1Teams = ['argentina', 'france', 'england', 'brazil', 'spain', 'germany', 'portugal'];
  const tier2Teams = ['netherlands', 'italy', 'belgium', 'uruguay', 'croatia', 'morocco', 'colombia'];

  let teamFactor = 3;
  if (tier1Teams.includes(team)) teamFactor = 1;
  else if (tier2Teams.includes(team)) teamFactor = 2;

  const isAttacker = position.includes('forward') || position.includes('st') || position.includes('winger') || position.includes('attack');
  const isMidfielder = position.includes('midfield') || position.includes('cam') || position.includes('cm');

  const isMarquee = mvTier === 1;
  const isElite = mvTier === 2;

  if (teamFactor === 1 && (isAttacker || isMarquee)) return 1;
  if ((teamFactor === 1 && (isMidfielder || isElite)) || (teamFactor === 2 && (isAttacker || isMarquee))) return 2;
  if (teamFactor <= 2 || (teamFactor === 3 && (isAttacker || isMarquee)) || (teamFactor === 1 && position.includes('def'))) return 3;
  if (teamFactor === 3 || position.includes('def') || position.includes('goalkeeper') || position.includes('gk')) return 4;
  return 5;
}

function Label({ children }: { children: ReactNode }) {
  return (
    <label
      style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--t3)',
        letterSpacing: 1,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </label>
  );
}

function formatCreatedAt(createdAt: number) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(createdAt);
}

export default function Landing({
  userId,
  authSession,
  managedUsers,
  onStart,
  onJoin,
  onLogin,
  onLogout,
  onCreateUser,
  onToggleUser,
}: LandingProps) {
  const [showJoin, setShowJoin] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showSquads, setShowSquads] = useState(false); 
  const [showSquadMenu, setShowSquadMenu] = useState(false); 
  const [selectedTournament, setSelectedTournament] = useState('FIFA World Cup 2026');
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loginIntent, setLoginIntent] = useState<'nav' | 'host'>('nav');
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomDetails, setRoomDetails] = useState<JoinRoomDetails | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamPhoto, setTeamPhoto] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ userId: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [settingsForm, setSettingsForm] = useState({ userId: '', password: '' });
  const [settingsError, setSettingsError] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [history, setHistory] = useState<RoomHistoryEntry[]>([]);
  const teamPhotoRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState('All');
  const [filterTier, setFilterTier] = useState('All');
  const [filterCountry, setFilterCountry] = useState('All');

  useEffect(() => {
    if (userId) {
      const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
      fetch(`/api/rooms?userId=${safeId}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const text = await res.text();
          return text ? JSON.parse(text) : {};
        })
        .then(data => {
          if (data && data.history) setHistory(data.history);
        })
        .catch(err => console.error("Failed to fetch room history:", err));
    }
  }, [userId]);

  const isAdmin = authSession?.isAdmin ?? false;
  
  async function checkRoom() {
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    setLoading(true);
    setError('');
    setRoomDetails(null);
    setTeamName('');
    setTeamPhoto(null);
    try {
      const code = roomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const formattedCode = code.startsWith('AUC-') ? code : `AUC-${code}`;
      
      const res = await fetch(`/api/rooms/${formattedCode}?t=${Date.now()}`, { cache: 'no-store' });
      const text = await res.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch(e) {
        throw new Error(`Server returned connection error: ${res.status}`);
      }

      if (data.error) throw new Error(data.error);
      setRoomDetails(data.room as JoinRoomDetails);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Room not found');
    } finally {
      setLoading(false);
    }
  }

  async function submitJoin() {
    if (!roomDetails) return;
    if (!userName.trim()) {
      setError('Please enter your display name');
      return;
    }
    if (!teamName.trim()) {
      setError('Please enter your team name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const cleanId = roomDetails.id.replace(/[^a-zA-Z0-9-]/g, '');
      const res = await fetch(`/api/rooms/${cleanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName: userName.trim(),
          teamName: teamName.trim(),
          teamPhoto,
        }),
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Vercel connection error (${res.status}). Payload might be too large.`);
      }

      if (!res.ok || data.error) throw new Error(data.error || 'Failed to join');
      
      onJoin(roomDetails.id, data.teamId, userName.trim());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to join');
    } finally {
      setLoading(false);
    }
  }

  function handleCloseJoin() {
    setShowJoin(false);
    setRoomCode('');
    setUserName('');
    setTeamName('');
    setTeamPhoto(null);
    setRoomDetails(null);
    setError('');
  }

  function openLogin(intent: 'nav' | 'host') {
    setLoginIntent(intent);
    setLoginError('');
    setLoginForm({ userId: '', password: '' });
    setShowLogin(true);
  }

  function closeLogin() {
    setShowLogin(false);
    setLoginError('');
    setLoginForm({ userId: '', password: '' });
  }

  function handleHostAccess() {
    if (authSession) {
      onStart();
      return;
    }
    openLogin('host');
  }

  function submitLogin() {
    if (!loginForm.userId.trim() || !loginForm.password.trim()) {
      setLoginError('Enter both user ID and password');
      return;
    }

    try {
      onLogin(loginForm.userId, loginForm.password);
      closeLogin();
      if (loginIntent === 'host') {
        onStart();
      }
    } catch (e: unknown) {
      setLoginError(e instanceof Error ? e.message : 'Login failed');
    }
  }

  function submitManagedUser() {
    if (!settingsForm.userId.trim() || !settingsForm.password.trim()) {
      setSettingsError('Add both a user ID and password');
      return;
    }

    try {
      onCreateUser(settingsForm.userId, settingsForm.password);
      setSettingsForm({ userId: '', password: '' });
      setSettingsError('');
      setSettingsMessage(`User ${settingsForm.userId.trim().toLowerCase()} created and activated`);
    } catch (e: unknown) {
      setSettingsMessage('');
      setSettingsError(e instanceof Error ? e.message : 'Failed to create user');
    }
  }

  function handleToggleManagedUser(targetUserId: string, active: boolean) {
    try {
      onToggleUser(targetUserId);
      setSettingsError('');
      setSettingsMessage(`${targetUserId} ${active ? 'deactivated' : 'activated'} successfully`);
    } catch (e: unknown) {
      setSettingsMessage('');
      setSettingsError(e instanceof Error ? e.message : 'Failed to update user');
    }
  }

  const masterCountriesList = Array.from(new Set(WC2026_PLAYERS.map((p: any) => p.country || p.nationality || 'Unknown'))).sort() as string[];

  const filteredPlayers = WC2026_PLAYERS.filter((player: any) => {
    const accurateTier = calculateHybridTier(player);
    const country = player.country || player.nationality || 'Unknown';
    const position = (player.role || player.position || '').toLowerCase();

    const matchesSearch = !searchQuery.trim() || 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (player.club && player.club.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesPosition = true;
    if (filterPosition !== 'All') {
      matchesPosition = position.includes(filterPosition.toLowerCase());
    }

    let matchesTier = true;
    if (filterTier !== 'All') {
      matchesTier = accurateTier === parseInt(filterTier);
    }

    let matchesCountry = true;
    if (filterCountry !== 'All') {
      matchesCountry = country === filterCountry;
    }

    return matchesSearch && matchesPosition && matchesTier && matchesCountry;
  });

  const activeCountries = Array.from(new Set(filteredPlayers.map((p: any) => p.country || p.nationality || 'Unknown'))).sort() as string[];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .landing-body { flex-direction: row; }
        .landing-sidebar { width: clamp(260px, 25vw, 340px); border-right: 1px solid var(--bd); padding: 24px 20px; overflow-y: auto; background: rgba(0,0,0,0.15); }
        .nav-container { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 14px clamp(16px,4vw,40px); border-bottom: 1px solid var(--bd); }
        .nav-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; align-items: center; }
        .nav-link { background: transparent; border: none; color: var(--t2); font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; padding: 8px 12px; border-radius: 6px; transition: all 0.2s; }
        .nav-link:hover { color: var(--t1); background: var(--bg3); }
        
        .squads-matrix {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          width: 100%;
          margin-top: 20px;
        }

        .filter-bar {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 12px;
          background: var(--bg3);
          border: 1px solid var(--bd2);
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        @media (max-width: 1024px) {
          .squads-matrix { grid-template-columns: repeat(2, 1fr) !important; }
          .filter-bar { grid-template-columns: 1fr 1fr !important; }
        }
        
        @media (max-width: 900px) {
          .landing-body { flex-direction: column !important; }
          .landing-sidebar { width: 100% !important; border-right: none !important; border-top: 1px solid var(--bd); height: auto; }
          .hero-title { font-size: clamp(60px, 15vw, 90px) !important; }
          .nav-actions { justify-content: center !important; width: 100%; margin-top: 8px; }
          .modal-content { padding: 16px !important; }
          .stat-blocks { margin-top: 24px !important; gap: 16px !important; }
          .squads-matrix { grid-template-columns: 1fr !important; }
          .filter-bar { grid-template-columns: 1fr !important; }
        }
      `}} />

      <nav className="nav-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Image 
            src="/kolacommunications.svg" 
            alt="KOLA Logo" 
            width={120} 
            height={32} 
            style={{ height: 32, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.5))' }} 
            priority 
          />
          {authSession && (
            <span
              className="tag"
              style={{
                background: authSession.isAdmin ? 'rgba(245,158,11,0.12)' : 'rgba(0,220,114,0.1)',
                color: authSession.isAdmin ? 'var(--am)' : 'var(--g)',
                border: `1px solid ${authSession.isAdmin ? 'rgba(245,158,11,0.2)' : 'rgba(0,220,114,0.18)'}`,
                padding: '4px 10px',
                fontSize: 11
              }}
            >
              {authSession.isAdmin ? 'Admin Mode' : `Logged In: ${authSession.userId}`}
            </span>
          )}
        </div>
        <div className="nav-actions">
          <button className="nav-link" onClick={() => setShowQuiz(true)}>🏆 WC Quiz</button>
          
          <div 
            style={{ position: 'relative', paddingBottom: '12px', marginBottom: '-12px' }}
            onMouseEnter={() => setShowSquadMenu(true)}
            onMouseLeave={() => setShowSquadMenu(false)}
          >
            <button className="nav-link">👕 Squads & Teams ▾</button>
            {showSquadMenu && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                background: 'var(--bg)', 
                border: '1px solid var(--bd2)', 
                borderRadius: 8, 
                padding: '6px 0', 
                minWidth: 200, 
                zIndex: 1000, 
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                marginTop: 0
              }}>
                <button 
                  className="nav-link" 
                  style={{ width: '100%', textAlign: 'left', borderRadius: 0, padding: '10px 16px', display: 'block' }} 
                  onClick={() => { setSelectedTournament('FIFA World Cup 2026'); setShowSquads(true); setShowSquadMenu(false); }}
                >
                  ⚽ FIFA World Cup 2026
                </button>
              </div>
            )}
          </div>

          <button className="nav-link" onClick={() => alert('Fixtures module is coming soon!')}>📅 Fixtures</button>
          
          <div style={{ width: 1, height: 20, background: 'var(--bd2)', margin: '0 8px' }} />
          
          <button className="btn bs bsm" onClick={() => setShowJoin(true)}>Join Room</button>
          {authSession ? (
            <>
              {isAdmin && (
                <button className="btn bs bsm" onClick={() => setShowSettings(true)}>Settings</button>
              )}
              <button className="btn bp bsm" onClick={onStart}>Create Room</button>
              <button className="btn bs bsm" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <button className="btn bp bsm" onClick={() => openLogin('nav')}>Login</button>
          )}
        </div>
      </nav>

      <div className="landing-body" style={{ flex: 1, display: 'flex', width: '100%', alignItems: 'stretch' }}>
        {userId && history.length > 0 && (
          <div className="landing-sidebar">
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: 'var(--t1)', marginBottom: 16 }}>Your Recent Rooms</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((room) => (
                <div key={room.id} className="card hover-lift" style={{ padding: 14, cursor: 'pointer', border: '1px solid var(--bd2)' }} onClick={() => {
                  setRoomCode(room.id);
                  setShowJoin(true);
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>{room.name}</div>
                    <span className="tag" style={{ fontSize: 9, padding: '2px 6px', background: room.phase === 'done' ? 'rgba(255,255,255,0.1)' : room.phase === 'bidding' ? 'rgba(0,220,114,0.15)' : 'rgba(245,158,11,0.15)', color: room.phase === 'done' ? 'var(--t3)' : room.phase === 'bidding' ? 'var(--g)' : 'var(--am)' }}>
                      {(room.phase || 'lobby').toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{room.sport}</span>
                    <span>{new Date(room.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--t2)', marginTop: 8, opacity: 0.6 }}>ID: {room.id}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px clamp(16px,4vw,40px) 36px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,220,114,.045) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ textAlign: 'center', animation: 'fadeUp .55s ease', position: 'relative', zIndex: 1, width: '100%' }}>
            
            <div style={{ display: 'inline-block', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--t3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
              Developed by <span style={{ color: 'var(--g)' }}>Kola</span>
            </div>

            <h1 className="hero-title" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '108px', lineHeight: 0.87, letterSpacing: 4, marginBottom: 14 }}>
              SPORTS<br />AUCTION<br /><span style={{ color: 'var(--g)' }}>ROOM</span>
            </h1>
            <p style={{ color: 'var(--t2)', fontSize: 17, maxWidth: 430, margin: '18px auto 32px', lineHeight: 1.65, fontWeight: 300 }}>
              Host live fantasy auctions with friends. Bid on players, build your squad, and see who gets the best value.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn bp" onClick={handleHostAccess} style={{ fontSize: 17, padding: '13px 34px' }}>
                {authSession ? '🚀 Host Auction' : '🔐 Login to Host'}
              </button>
              <button className="btn bs" onClick={() => setShowJoin(true)} style={{ fontSize: 17, padding: '13px 34px' }}>Join a Room</button>
            </div>
            <div className="stat-blocks" style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
              {[{ v: '2,400+', l: 'Auctions' }, { v: '18K+', l: 'Players Sold' }, { v: '4.9★', l: 'Rating' }].map((s) => (
                <div key={s.l} style={{ textAlign: 'center', minWidth: 90 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, color: 'var(--g)', letterSpacing: 2 }}>{s.v}</div>
                  <div style={{ color: 'var(--t3)', fontSize: 12, fontFamily: "'Rajdhani', sans-serif", letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '64px clamp(16px,4vw,40px)', background: 'linear-gradient(to bottom, var(--bg) 0%, var(--bg2) 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, var(--g), transparent)', opacity: 0.3 }} />
        
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-block', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--g)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, padding: '6px 14px', background: 'rgba(0,220,114,0.1)', borderRadius: 20, border: '1px solid rgba(0,220,114,0.2)' }}>
            Platform Features
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(40px, 6vw, 56px)', letterSpacing: 3, color: 'var(--t1)', margin: 0 }}>
            WHAT&apos;S <span style={{ color: 'var(--g)' }}>INSIDE</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {FEATURES.map(([icon, title, desc]) => (
            <div key={title} className="card hover-lift" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, transparent 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(0,220,114,0.1)', border: '1px solid rgba(0,220,114,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 0 20px rgba(0,220,114,0.1) inset' }}>
                {icon}
              </div>
              <div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--t1)', marginBottom: 8, letterSpacing: 0.5 }}>{title}</div>
                <p style={{ color: 'var(--t2)', fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showQuiz && <WorldCupQuiz onClose={() => setShowQuiz(false)} />}

      {/* DETAILED TEAMS & SQUADS DATA COMPOSER OVERLAY */}
      {showSquads && (
        <div style={{ ...overlayStyle, display: 'block', padding: '40px 24px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 1340, margin: '0 auto', padding: 28, background: 'var(--bg)', border: '1px solid var(--bd2)', animation: 'fadeUp 0.3s ease' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bd)', paddingBottom: 16, marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2, margin: 0 }}>👕 SQUADS & TEAMS</h3>
                <p style={{ color: 'var(--t3)', fontSize: 13, margin: '4px 0 0' }}>Examine structural compositions mapped via Hybrid Point Performance ceilings.</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <select 
                  className="inp" 
                  value={selectedTournament} 
                  onChange={(e) => setSelectedTournament(e.target.value)}
                  style={{ minWidth: 240, height: 40, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}
                >
                  <option value="FIFA World Cup 2026">FIFA World Cup 2026</option>
                </select>
                <button onClick={() => setShowSquads(false)} style={{ background: 'var(--bg3)', border: '1px solid var(--bd)', color: 'var(--t1)', width: 40, height: 40, borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}>✕</button>
              </div>
            </div>

            <div className="filter-bar">
              <div>
                <Label>Search Player / Club</Label>
                <input 
                  type="text" 
                  className="inp" 
                  placeholder="e.g. Bukayo Saka or Real Madrid..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ marginTop: 4, height: 38 }}
                />
              </div>

              <div>
                <Label>Filter By Team</Label>
                <select className="inp" value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} style={{ marginTop: 4, height: 38 }}>
                  <option value="All">All Nations ({masterCountriesList.length})</option>
                  {masterCountriesList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Filter By Position</Label>
                <select className="inp" value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)} style={{ marginTop: 4, height: 38 }}>
                  <option value="All">All Positions</option>
                  <option value="Goalkeeper">Goalkeepers</option>
                  <option value="Defender">Defenders</option>
                  <option value="Midfielder">Midfielders</option>
                  <option value="Forward">Forwards</option>
                </select>
              </div>

              <div>
                <Label>Filter By Tier</Label>
                <select className="inp" value={filterTier} onChange={(e) => setFilterTier(e.target.value)} style={{ marginTop: 4, height: 38 }}>
                  <option value="All">All Tiers</option>
                  <option value="1">Tier 1 (Premium)</option>
                  <option value="2">Tier 2 (Elite)</option>
                  <option value="3">Tier 3 (Core)</option>
                  <option value="4">Tier 4 (Enablers)</option>
                  <option value="5">Tier 5 (Fodder)</option>
                </select>
              </div>
            </div>

            <div style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--t2)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>
              💡 Showing <span style={{ color: 'var(--g)' }}>{filteredPlayers.length}</span> matching players across <span style={{ color: 'var(--am)' }}>{activeCountries.length}</span> active teams.
            </div>

            {selectedTournament === 'FIFA World Cup 2026' && (
              activeCountries.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--t3)', fontFamily: "'Rajdhani', sans-serif" }}>
                  🚫 No players match your current filter parameters. Try expanding your parameters.
                </div>
              ) : (
                <div className="squads-matrix">
                  {activeCountries.map((countryName) => {
                    const countryPlayers = filteredPlayers.filter((p: any) => (p.country || p.nationality || '') === countryName);
                    
                    const gks = countryPlayers.filter((p: any) => (p.role || '').toLowerCase().includes('goalkeeper') || (p.role || '').toLowerCase() === 'gk');
                    const defs = countryPlayers.filter((p: any) => (p.role || '').toLowerCase().includes('defender') || (p.role || '').toLowerCase() === 'def');
                    const mids = countryPlayers.filter((p: any) => (p.role || '').toLowerCase().includes('midfielder') || (p.role || '').toLowerCase().includes('midfield') || (p.role || '').toLowerCase() === 'cm');
                    const fwds = countryPlayers.filter((p: any) => (p.role || '').toLowerCase().includes('forward') || (p.role || '').toLowerCase().includes('attack') || (p.role || '').toLowerCase() === 'st' || (p.role || '').toLowerCase() === 'winger');

                    return (
                      <div key={countryName} className="card" style={{ padding: 20, background: 'var(--bg2)', border: '1px solid var(--bd)', alignSelf: 'start' }}>
                        <h4 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: 'var(--g)', letterSpacing: 1.5, borderBottom: '1px solid var(--bd2)', paddingBottom: 6, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          🌍 {countryName} 
                          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: 'var(--t3)', marginLeft: 'auto', fontWeight: 600 }}>({countryPlayers.length})</span>
                        </h4>

                        {[
                          { title: '🧤 Goalkeepers', list: gks },
                          { title: '🛡️ Defenders', list: defs },
                          { title: '🛡️ Midfielders', list: mids },
                          { title: '🚀 Forwards', list: fwds }
                        ].map((positionGroup) => {
                          if (positionGroup.list.length === 0) return null;
                          return (
                            <div key={positionGroup.title} style={{ marginBottom: 14 }}>
                              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                                {positionGroup.title}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 6 }}>
                                {positionGroup.list.map((player: any, idx: number) => {
                                  const hybridTier = calculateHybridTier(player);
                                  return (
                                    <div key={idx} style={{ fontSize: 13, color: 'var(--t1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg3)', padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.02)' }}>
                                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginRight: 8 }}>
                                        <b>{player.name}</b> 
                                        {player.club ? <span style={{ color: 'var(--t3)', fontSize: 11 }}> | {player.club}</span> : null}
                                      </div>
                                      <span style={{ 
                                        fontFamily: "'Rajdhani', sans-serif", 
                                        fontSize: 10, 
                                        fontWeight: 700, 
                                        padding: '2px 6px', 
                                        borderRadius: 4, 
                                        background: hybridTier === 1 ? 'rgba(0,220,114,0.12)' : hybridTier === 2 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)', 
                                        color: hybridTier === 1 ? 'var(--g)' : hybridTier === 2 ? 'var(--am)' : 'var(--t2)',
                                        flexShrink: 0
                                      }}>
                                        T{hybridTier}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {showJoin && (
        <div style={overlayStyle}>
          <div className="card modal-content" style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2 }}>JOIN AUCTION ROOM</h3>
              <button onClick={handleCloseJoin} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {error && (
              <div style={{ fontSize: 13, padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: 'var(--re)', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚠️ {error}
              </div>
            )}

            {!roomDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Label>Room Code</Label>
                  <input className="inp" placeholder="e.g. 7291 or AUC-7291" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') checkRoom(); }} style={{ fontSize: '16px' }} />
                </div>
                <button className="btn bp" onClick={checkRoom} disabled={loading} style={{ width: '100%', padding: 12 }}>
                  {loading ? 'Finding...' : 'Find Room →'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(() => {
                  const joinedTeams = roomDetails.participants.filter((participant) => participant.ownerId !== null).length;
                  const openTeams = roomDetails.participants.length - joinedTeams;
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: 'var(--bg3)', border: '1px solid var(--bd2)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1 }}>Joined Teams</div>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: 'var(--g)', letterSpacing: 2 }}>{joinedTeams}</div>
                      </div>
                      <div style={{ background: 'var(--bg3)', border: '1px solid var(--bd2)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1 }}>Open Slots</div>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: openTeams > 0 ? 'var(--am)' : 'var(--re)', letterSpacing: 2 }}>{openTeams}</div>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ background: 'var(--bg3)', border: '1px solid var(--bd2)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--g)', letterSpacing: 1 }}>{roomDetails.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t2)', marginTop: 4, gap: 12, flexWrap: 'wrap' }}>
                    <span>🏆 {roomDetails.tournament} ({roomDetails.sport})</span>
                    <span>💰 Budget: ₹{roomDetails.budget}L</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Label>Your Name / Alias</Label>
                  <input className="inp" placeholder="Enter your name" value={userName} onChange={(e) => setUserName(e.target.value)} style={{ fontSize: '16px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Label>Your Team Name</Label>
                  <input className="inp" placeholder="Enter your team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} style={{ fontSize: '16px' }} />
                </div>

                <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ cursor: 'pointer' }} onClick={() => teamPhotoRef.current?.click()}>
                    <Avatar name={teamName || 'Team'} size={60} color="var(--g)" photo={teamPhoto} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Label>Team Logo (Optional)</Label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn bs bsm" onClick={() => teamPhotoRef.current?.click()}>
                        Upload Logo
                      </button>
                      {teamPhoto && (
                        <button className="btn bs bsm" onClick={() => setTeamPhoto(null)}>
                          Remove Logo
                        </button>
                      )}
                    </div>
                    <div style={{ color: 'var(--t3)', fontSize: 11 }}>
                      The next available slot will be assigned to this team.
                    </div>
                  </div>
                  <input
                    ref={teamPhotoRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const img = new window.Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_SIZE = 150; 
                        let width = img.width;
                        let height = img.height;

                        if (width > height && width > MAX_SIZE) {
                          height *= MAX_SIZE / width;
                          width = MAX_SIZE;
                        } else if (height > MAX_SIZE) {
                          width *= MAX_SIZE / height;
                          height = MAX_SIZE;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(img, 0, 0, width, height);
                          setTeamPhoto(canvas.toDataURL('image/jpeg', 0.8));
                        }
                      };
                      img.onerror = () => {
                        setError('Failed to process image. Try a different one.');
                      };
                      img.src = URL.createObjectURL(file);
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                  <button className="btn bs" onClick={handleCloseJoin} style={{ flex: 1, minWidth: 100 }}>Back</button>
                  <button className="btn bp" onClick={submitJoin} disabled={loading || !userName || !teamName} style={{ flex: 2, minWidth: 180 }}>
                    {loading ? 'Joining...' : 'Join Auction →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showLogin && (
        <div style={overlayStyle}>
          <div className="card modal-content" style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2 }}>LOGIN</h3>
                <p style={{ color: 'var(--t3)', fontSize: 12, marginTop: 4 }}>
                  Sign in to host auctions and access admin settings.
                </p>
              </div>
              <button onClick={closeLogin} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {loginError && (
              <div style={{ fontSize: 13, padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: 'var(--re)', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚠️ {loginError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label>User ID</Label>
                <input
                  className="inp"
                  placeholder="Enter your user ID"
                  value={loginForm.userId}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, userId: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitLogin(); }}
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label>Password</Label>
                <input
                  className="inp"
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitLogin(); }}
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <button className="btn bp" onClick={submitLogin} style={{ width: '100%', padding: 12 }}>
              Login →
            </button>
          </div>
        </div>
      )}

      {showSettings && isAdmin && (
        <div style={overlayStyle}>
          <div className="card modal-content" style={{ ...modalStyle, maxWidth: 760 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, letterSpacing: 2 }}>USER SETTINGS</h3>
                <p style={{ color: 'var(--t3)', fontSize: 12, marginTop: 4 }}>
                  Create user IDs and activate or deactivate access.
                </p>
              </div>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
              <div className="card" style={{ padding: 18, background: 'rgba(0,220,114,0.04)', border: '1px solid rgba(0,220,114,0.16)' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 1.5, marginBottom: 14 }}>CREATE USER</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Label>New User ID</Label>
                    <input
                      className="inp"
                      placeholder="e.g. auctionhost01"
                      value={settingsForm.userId}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, userId: e.target.value }))}
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Label>Password</Label>
                    <input
                      className="inp"
                      type="password"
                      placeholder="Set a password"
                      value={settingsForm.password}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, password: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitManagedUser(); }}
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <button className="btn bp" onClick={submitManagedUser}>Create User</button>
                </div>
              </div>

              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 1.5, marginBottom: 14 }}>ADMIN ACCOUNT</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: 'var(--bg3)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 10, padding: 14 }}>
                    <div>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--t1)' }}>admin</div>
                      <div style={{ color: 'var(--t3)', fontSize: 12 }}>Reserved account for settings access</div>
                    </div>
                    <span className="tag" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--am)' }}>
                      Always Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {(settingsError || settingsMessage) && (
              <div style={{
                fontSize: 13,
                padding: '10px 12px',
                borderRadius: 8,
                background: settingsError ? 'rgba(239,68,68,0.08)' : 'rgba(0,220,114,0.08)',
                color: settingsError ? 'var(--re)' : 'var(--g)',
                border: `1px solid ${settingsError ? 'rgba(239,68,68,0.2)' : 'rgba(0,220,114,0.18)'}`,
              }}>
                {settingsError ? `⚠️ ${settingsError}` : `✅ ${settingsMessage}`}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <h4 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 1.5 }}>MANAGED USERS</h4>
                <span style={{ color: 'var(--t3)', fontSize: 12 }}>
                  {managedUsers.length} user{managedUsers.length === 1 ? '' : 's'}
                </span>
              </div>

              {managedUsers.length === 0 ? (
                <div className="card" style={{ padding: 18, color: 'var(--t3)', textAlign: 'center' }}>
                  No additional users yet. Create one above to allow more hosts to log in.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                  {[...managedUsers]
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((managedUser) => (
                      <div key={managedUser.userId} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                          <div>
                            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16 }}>{managedUser.userId}</div>
                            <div style={{ color: 'var(--t3)', fontSize: 11, marginTop: 3 }}>
                              Created {formatCreatedAt(managedUser.createdAt)}
                            </div>
                          </div>
                          <span
                            className="tag"
                            style={{
                              background: managedUser.active ? 'rgba(0,220,114,0.1)' : 'rgba(239,68,68,0.1)',
                              color: managedUser.active ? 'var(--g)' : 'var(--re)',
                            }}
                          >
                            {managedUser.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <button
                          className={`btn ${managedUser.active ? 'bs' : 'bp'}`}
                          onClick={() => handleToggleManagedUser(managedUser.userId, managedUser.active)}
                        >
                          {managedUser.active ? 'Deactivate User' : 'Activate User'}
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}