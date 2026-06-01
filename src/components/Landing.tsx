'use client';
import { useState } from 'react';
import { ServerRoom } from '@/lib/db';

interface LandingProps {
  userId: string;
  onStart: () => void;
  onJoin: (roomId: string, teamId: string, userName: string) => void;
}

const FEATURES = [
  ['⚡', 'Live Bidding', '30s countdown — every bid adds +20 seconds to the clock'],
  ['🔍', 'AI Player Scout', 'Search any player name or URL; AI fetches role, country & base price'],
  ['📁', 'Smart Upload', 'Import from Excel (.xlsx) — columns auto-detected'],
  ['📄', 'PDF Parsing', 'Upload a PDF squad list; AI extracts all players automatically'],
  ['🎨', 'Custom Teams', 'Set your team name and upload your own logo/photo'],
  ['🏟', 'Multi-Sport', 'IPL, UEFA, FIFA, NBA or any custom tournament'],
];

export default function Landing({ userId, onStart, onJoin }: LandingProps) {
  const [showJoin, setShowJoin] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomDetails, setRoomDetails] = useState<ServerRoom | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  async function checkRoom() {
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    setLoading(true);
    setError('');
    setRoomDetails(null);
    setSelectedTeamId('');
    try {
      const code = roomCode.trim().toUpperCase();
      const formattedCode = code.startsWith('AUC-') ? code : `AUC-${code}`;
      const res = await fetch(`/api/rooms/${formattedCode}`);
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setRoomDetails(data.room);
    } catch (e: any) {
      setError(e.message || 'Room not found');
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
    if (!selectedTeamId) {
      setError('Please select a team');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/rooms/${roomDetails.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          teamId: selectedTeamId,
          userName: userName.trim(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      onJoin(roomDetails.id, selectedTeamId, userName.trim());
    } catch (e: any) {
      setError(e.message || 'Failed to join');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setShowJoin(false);
    setRoomCode('');
    setUserName('');
    setRoomDetails(null);
    setSelectedTeamId('');
    setError('');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Ticker */}
      <div style={{ background: 'var(--g)', overflow: 'hidden', whiteSpace: 'nowrap', padding: '5px 0' }}>
        <span style={{ display: 'inline-block', animation: 'ticker 24s linear infinite', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 12, color: '#000', letterSpacing: 1 }}>
          🔴 LIVE: Virat Kohli SOLD ₹260L &nbsp;•&nbsp; Bumrah going ₹228L &nbsp;•&nbsp; New IPL 2025 room open &nbsp;•&nbsp; Rashid Khan SOLD ₹148L &nbsp;•&nbsp; AI auto-priced 12 players from Wikipedia &nbsp;•&nbsp;
        </span>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', borderBottom: '1px solid var(--bd)' }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: 'var(--g)', letterSpacing: 3 }}>SAR</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn bs bsm" onClick={() => setShowJoin(true)}>Join Room</button>
          <button className="btn bp bsm" onClick={onStart}>Create Room</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 40px 36px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,220,114,.045) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', animation: 'fadeUp .55s ease', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(54px,9vw,108px)', lineHeight: 0.87, letterSpacing: 4, marginBottom: 14 }}>
            SPORTS<br />AUCTION<br /><span style={{ color: 'var(--g)' }}>ROOM</span>
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 17, maxWidth: 430, margin: '18px auto 32px', lineHeight: 1.65, fontWeight: 300 }}>
            Host live fantasy auctions with friends. Bid on players, build your squad, and see who gets the best value.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn bp" onClick={onStart} style={{ fontSize: 17, padding: '13px 34px' }}>🚀 Host Auction</button>
            <button className="btn bs" onClick={() => setShowJoin(true)} style={{ fontSize: 17, padding: '13px 34px' }}>Join a Room</button>
          </div>
          <div style={{ display: 'flex', gap: 48, justifyContent: 'center', marginTop: 48 }}>
            {[{ v: '2,400+', l: 'Auctions' }, { v: '18K+', l: 'Players Sold' }, { v: '4.9★', l: 'Rating' }].map((s) => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, color: 'var(--g)', letterSpacing: 2 }}>{s.v}</div>
                <div style={{ color: 'var(--t3)', fontSize: 12, fontFamily: "'Rajdhani', sans-serif", letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '44px 40px', background: 'var(--bg2)', borderTop: '1px solid var(--bd)' }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: 3, textAlign: 'center', marginBottom: 28 }}>WHAT&apos;S INSIDE</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, maxWidth: 1100, margin: '0 auto' }}>
          {FEATURES.map(([icon, title, desc]) => (
            <div key={title} className="card" style={{ padding: 18 }}>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginBottom: 7 }}>{icon} {title}</div>
              <p style={{ color: 'var(--t2)', fontSize: 13, lineHeight: 1.55 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Join Room Modal */}
      {showJoin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,7,14,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, animation: 'fadeUp 0.3s ease', border: '1px solid var(--bd2)', display: 'flex', flexDirection: 'column', gap: 18, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2 }}>JOIN AUCTION ROOM</h3>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {error && (
              <div style={{ fontSize: 13, padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: 'var(--re)', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚠️ {error}
              </div>
            )}

            {!roomDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase' }}>Room Code</label>
                  <input className="inp" placeholder="e.g. 7291 or AUC-7291" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') checkRoom(); }} />
                </div>
                <button className="btn bp" onClick={checkRoom} disabled={loading} style={{ width: '100%', padding: 12 }}>
                  {loading ? 'Finding...' : 'Find Room →'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Room Info */}
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--bd2)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--g)', letterSpacing: 1 }}>{roomDetails.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>
                    <span>🏆 {roomDetails.tournament} ({roomDetails.sport})</span>
                    <span>💰 Budget: ₹{roomDetails.budget}L</span>
                  </div>
                </div>

                {/* Nickname input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase' }}>Your Name / Alias</label>
                  <input className="inp" placeholder="Enter your name" value={userName} onChange={(e) => setUserName(e.target.value)} />
                </div>

                {/* Team selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase' }}>Select Your Team</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {roomDetails.participants.map((t) => {
                      const isTaken = t.ownerId !== null && t.ownerId !== userId;
                      const isMine = t.ownerId === userId;
                      const isSelected = selectedTeamId === t.id;

                      let borderClr = 'var(--bd)';
                      let bg = 'var(--bg3)';
                      if (isTaken) {
                        borderClr = 'rgba(239,68,68,0.2)';
                        bg = 'rgba(15,21,38,0.4)';
                      } else if (isSelected || isMine) {
                        borderClr = t.color;
                        bg = `${t.color}12`;
                      }

                      return (
                        <div key={t.id}
                          onClick={() => { if (!isTaken) setSelectedTeamId(t.id); }}
                          style={{
                            border: `1px solid ${borderClr}`,
                            background: bg,
                            borderRadius: 8,
                            padding: 12,
                            cursor: isTaken ? 'not-allowed' : 'pointer',
                            opacity: isTaken ? 0.5 : 1,
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            textAlign: 'center'
                          }}>
                          <span style={{
                            fontFamily: "'Rajdhani', sans-serif",
                            fontWeight: 700,
                            fontSize: 14,
                            color: isTaken ? 'var(--t3)' : t.color
                          }}>
                            {t.name}
                          </span>
                          {isTaken ? (
                            <span style={{ fontSize: 9, background: 'rgba(239,68,68,0.1)', color: 'var(--re)', padding: '1px 6px', borderRadius: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>TAKEN</span>
                          ) : isMine ? (
                            <span style={{ fontSize: 9, background: 'rgba(0,220,114,0.1)', color: 'var(--g)', padding: '1px 6px', borderRadius: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>YOURS</span>
                          ) : (
                            <span style={{ fontSize: 9, background: 'var(--bd)', color: 'var(--t2)', padding: '1px 6px', borderRadius: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>SELECT</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button className="btn bs" onClick={() => setRoomDetails(null)} style={{ flex: 1 }}>Back</button>
                  <button className="btn bp" onClick={submitJoin} disabled={loading || !selectedTeamId || !userName} style={{ flex: 2 }}>
                    {loading ? 'Joining...' : 'Join Auction →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
