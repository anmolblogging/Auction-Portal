'use client';
import { useState, useRef } from 'react';
import { Player, Team, Participant, RoomConfig } from '@/lib/types';
import { DEFAULT_PLAYERS, DEFAULT_TEAMS } from '@/lib/data';
import { RBadge, TBadge } from '@/components/ui/Badges';
import TeamCard from '@/components/TeamCard';
import Spinner from '@/components/ui/Spinner';

interface CreateRoomProps {
  userId: string;
  onLaunch: (roomId: string, teamId: string, userName: string) => void;
  onBack: () => void;
}

function makeInitials(name: string) {
  return name.split(' ').map((w) => w[0] || '').join('').slice(0, 3).toUpperCase();
}

function Lbl({ children }: { children: React.ReactNode }) {
  return <label style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{children}</label>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}><Lbl>{label}</Lbl>{children}</div>;
}

export default function CreateRoom({ userId, onLaunch, onBack }: CreateRoomProps) {
  const [step, setStep] = useState(1);
  const [roomId] = useState(() => `AUC-${Math.floor(1000 + Math.random() * 9000)}`);
  const [cfg, setCfg] = useState<RoomConfig & { enableBots: boolean }>({ name: 'IPL Fantasy 2025', sport: 'Cricket / IPL', tournament: 'IPL 2025', participants: 4, budget: 1500, squadSize: 11, enableBots: true });
  const [teams, setTeams] = useState<Team[]>(DEFAULT_TEAMS.map((t) => ({ ...t })));
  const [players, setPlayers] = useState<Player[]>([...DEFAULT_PLAYERS]);

  const [sq, setSq] = useState('');
  const [sLoad, setSLoad] = useState(false);
  const [sErr, setSErr] = useState('');
  const [sRes, setSRes] = useState<Player[]>([]);
  const [fLoad, setFLoad] = useState(false);
  const [fMsg, setFMsg] = useState('');
  const [launching, setLaunching] = useState(false);
  const [launchErr, setLaunchErr] = useState('');
  const [launchMode, setLaunchMode] = useState<'now' | 'schedule'>('now');
  
  // Default scheduled time: today + 1 hour, rounded to next 30 min
  const getDefaultSchedule = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(d.getMinutes() >= 30 ? 0 : 30, 0, 0);
    if (d.getMinutes() === 0) d.setHours(d.getHours());
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().slice(0, 5);
    return { date: dateStr, time: timeStr };
  };
  const defaults = getDefaultSchedule();
  const [scheduledDate, setScheduledDate] = useState(defaults.date);
  const [scheduledTime, setScheduledTime] = useState(defaults.time);
  
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualP, setManualP] = useState({ name: '', role: 'Batter', country: 'India', base: 50 });

  const xlRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const updTeam = (id: string, update: Partial<Team>) =>
    setTeams((ts) => ts.map((t) => (t.id === id ? { ...t, ...update } : t)));

  async function doSearch() {
    if (!sq.trim()) return;
    setSLoad(true); setSErr(''); setSRes([]);
    try {
      const res = await fetch('/api/search-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sq }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSRes(data.players || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Search failed';
      setSErr(msg.includes('API_KEY') ? 'Add GROQ_API_KEY to .env.local to enable AI search.' : 'Search failed: ' + msg);
    }
    setSLoad(false);
  }

  function addResult(p: Player) {
    setPlayers((ps) => [...ps, { ...p, id: Date.now() + Math.random() }]);
    setSRes((r) => r.filter((x) => x.name !== p.name));
  }

  function addManual() {
    setShowManualForm(true);
  }
  
  function saveManualPlayer() {
    if (!manualP.name.trim()) return;
    setPlayers((ps) => [...ps, { 
      id: Date.now(), 
      name: manualP.name.trim(), 
      role: manualP.role, 
      country: manualP.country, 
      nat: '🌍', 
      tier: 'Gold', 
      base: manualP.base, 
      img: makeInitials(manualP.name) 
    }]);
    setShowManualForm(false);
    setManualP({ name: '', role: 'Batter', country: 'India', base: 50 });
  }

  async function onExcel(file: File) {
    setFLoad(true); setFMsg('⏳ Reading Excel…');
    try {
      const XLSX = (await import('xlsx')).default;
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
      const ps: Player[] = rows.map((r, i) => ({
        id: Date.now() + i,
        name: String(r.Name || r.name || r.Player || r.player || ''),
        role: String(r.Role || r.role || r.Position || 'Batter'),
        country: String(r.Country || r.country || ''),
        nat: String(r.nat || r.Emoji || r.Flag || '🌍'),
        tier: String(r.Tier || r.tier || 'Gold'),
        base: parseInt(String(r.Base || r.base || r['Base Price'] || r.Price || 50)) || 50,
        img: makeInitials(String(r.Name || r.name || 'XX')),
      })).filter((p) => p.name);
      setPlayers((prev) => [...prev, ...ps]);
      setFMsg(`✅ Added ${ps.length} players from Excel`);
    } catch (e: unknown) {
      setFMsg('❌ ' + (e instanceof Error ? e.message : 'Error reading file'));
    }
    setFLoad(false);
    if (xlRef.current) xlRef.current.value = '';
  }

  async function onPDF(file: File) {
    setFLoad(true); setFMsg('⏳ AI reading PDF…');
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const rd = new FileReader();
        rd.onload = () => res((rd.result as string).split(',')[1]);
        rd.onerror = rej;
        rd.readAsDataURL(file);
      });
      const resp = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: b64 }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setPlayers((prev) => [...prev, ...data.players]);
      setFMsg(`✅ Added ${data.players.length} players from PDF`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      setFMsg(msg.includes('API_KEY') ? '⚠️ Add ANTHROPIC_API_KEY to .env.local to enable PDF parsing.' : '❌ ' + msg);
    }
    setFLoad(false);
    if (pdfRef.current) pdfRef.current.value = '';
  }

  const stepList = [{ n: 1, l: 'Setup' }, { n: 2, l: 'Teams' }, { n: 3, l: 'Players' }, { n: 4, l: 'Launch' }];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '13px 36px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: 'var(--g)', letterSpacing: 2 }}>SAR</span>
        <span style={{ color: 'var(--t3)' }}>/</span>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: 'var(--t2)' }}>Create Auction Room</span>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '32px 18px' }}>
        <div style={{ width: '100%', maxWidth: 680 }}>
          {/* Step tabs */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 28, background: 'var(--bg2)', borderRadius: 9, padding: 3, border: '1px solid var(--bd)' }}>
            {stepList.map((s) => (
              <button key={s.n} onClick={() => { if (s.n < step) setStep(s.n); }}
                style={{ flex: 1, padding: 8, borderRadius: 7, border: 'none', cursor: s.n <= step ? 'pointer' : 'default', background: step === s.n ? 'var(--g)' : 'transparent', color: step === s.n ? '#000' : step > s.n ? 'var(--t2)' : 'var(--t3)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: .5, textTransform: 'uppercase', transition: 'all .2s' }}>
                {s.n}. {s.l}
              </button>
            ))}
          </div>

          {/* STEP 1 — Setup */}
          {step === 1 && (
            <div key="s1" style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp .4s ease' }}>
              <div className="card" style={{ padding: 22 }}>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, letterSpacing: 2, marginBottom: 20 }}>ROOM SETUP</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Room Name">
                    <input className="inp" value={cfg.name} onChange={(e) => setCfg({ ...cfg, name: e.target.value })} />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Sport">
                      <select className="inp" value={cfg.sport} onChange={(e) => setCfg({ ...cfg, sport: e.target.value })}>
                        {['Cricket / IPL', 'Football / UEFA', 'Football / FIFA', 'Basketball / NBA', 'Custom'].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label="Tournament">
                      <input className="inp" value={cfg.tournament} onChange={(e) => setCfg({ ...cfg, tournament: e.target.value })} />
                    </Field>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <Field label="Participants">
                      <input className="inp" type="number" min={2} max={8} value={cfg.participants} onChange={(e) => setCfg({ ...cfg, participants: parseInt(e.target.value) || 2 })} />
                    </Field>
                    <Field label="Budget (₹L)">
                      <input className="inp" type="number" value={cfg.budget} onChange={(e) => setCfg({ ...cfg, budget: parseInt(e.target.value) || 500 })} />
                    </Field>
                    <Field label="Squad Size">
                      <input className="inp" type="number" value={cfg.squadSize} onChange={(e) => setCfg({ ...cfg, squadSize: parseInt(e.target.value) || 11 })} />
                    </Field>
                  </div>
                  <Field label="CPU Bots Bidding">
                    <select className="inp" value={cfg.enableBots ? 'Enabled' : 'Disabled'} onChange={(e) => setCfg({ ...cfg, enableBots: e.target.value === 'Enabled' })}>
                      <option value="Enabled">Enabled (Bots bid automatically)</option>
                      <option value="Disabled">Disabled (Only real players bid)</option>
                    </select>
                  </Field>
                  <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px 16px', border: '1px solid var(--bd2)', fontSize: 14, color: 'var(--t2)', lineHeight: 1.5 }}>
                    ⏱️ Timer fixed at <b style={{ color: 'var(--g)' }}>30 seconds</b> per player.<br />
                    Every bid extends the clock by <b style={{ color: 'var(--am)' }}>20 seconds</b> (max 60s).
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn bs" onClick={onBack} style={{ flex: 1 }}>← Back to Home</button>
                <button className="btn bp" onClick={() => setStep(2)} style={{ flex: 2, fontSize: 15, padding: 13 }}>Next: Team Setup →</button>
              </div>
            </div>
          )}

          {/* STEP 2 — Teams */}
          {step === 2 && (
            <div key="s2" style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp .4s ease' }}>
              <div className="card" style={{ padding: 22 }}>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, letterSpacing: 2, marginBottom: 6 }}>TEAM SETUP</h3>
                <p style={{ color: 'var(--t2)', fontSize: 13, marginBottom: 18 }}>Click any avatar to upload a team photo/logo. Edit the name below it.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
                  {teams.slice(0, cfg.participants).map((t) => (
                    <TeamCard key={t.id} team={t} onChange={(u) => updTeam(t.id, u)} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn bs" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
                <button className="btn bp" onClick={() => setStep(3)} style={{ flex: 2, fontSize: 15 }}>Next: Players →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Players */}
          {step === 3 && (
            <div key="s3" style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp .4s ease' }}>
              {/* AI Search */}
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, marginBottom: 12 }}>🔍 FETCH FROM WEB / AI</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input className="inp" value={sq} onChange={(e) => setSq(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
                    placeholder="Player name  or  https://en.wikipedia.org/wiki/..." />
                  <button className="btn bp bsm" onClick={doSearch} disabled={sLoad} style={{ flexShrink: 0 }}>
                    {sLoad ? <Spinner /> : 'Search'}
                  </button>
                </div>
                <button className="btn bs bsm" onClick={addManual} style={{ marginBottom: (sErr || sRes.length > 0 || showManualForm) ? 10 : 0 }}>＋ Add Player Manually</button>
                
                {showManualForm && (
                  <div className="card hover-lift" style={{ marginBottom: 12, padding: 16, background: 'rgba(0, 220, 114, 0.05)', border: '1px solid var(--g)' }}>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--g)' }}>ADD MANUAL PLAYER</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <input className="inp" placeholder="Player Name" value={manualP.name} onChange={(e) => setManualP({ ...manualP, name: e.target.value })} />
                      <select className="inp" value={manualP.role} onChange={(e) => setManualP({ ...manualP, role: e.target.value })}>
                        <option>Batter</option><option>Bowler</option><option>All-rounder</option><option>WK-Batter</option>
                      </select>
                      <input className="inp" placeholder="Country" value={manualP.country} onChange={(e) => setManualP({ ...manualP, country: e.target.value })} />
                      <input className="inp" type="number" placeholder="Base Price (Lakhs)" value={manualP.base} onChange={(e) => setManualP({ ...manualP, base: parseInt(e.target.value) || 50 })} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button className="btn bp" onClick={saveManualPlayer}>Save Player</button>
                      <button className="btn bs" onClick={() => setShowManualForm(false)}>Cancel</button>
                    </div>
                  </div>
                )}
                
                {sErr && <div style={{ fontSize: 12, padding: '7px 10px', borderRadius: 6, marginBottom: 8, background: 'rgba(239,68,68,.08)', color: 'var(--re)', lineHeight: 1.4 }}>{sErr}</div>}
                {sRes.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sRes.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--bd2)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--t1)', marginBottom: 5 }}>{p.nat || '🌍'} {p.name}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                            <RBadge role={p.role || 'Batter'} />
                            <TBadge tier={p.tier || 'Gold'} />
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: 'var(--g)', marginLeft: 2 }}>₹{p.base || 50}L</span>
                          </div>
                          {p.bio && <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.4 }}>{p.bio}</div>}
                        </div>
                        <button className="btn bp bsm" onClick={() => addResult(p)}>+ Add</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, marginBottom: 12 }}>📁 UPLOAD FILE</div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <button className="btn bs" onClick={() => xlRef.current?.click()} disabled={fLoad} style={{ flex: 1 }}>📊 Upload Excel (.xlsx / .csv)</button>
                  <button className="btn bs" onClick={() => pdfRef.current?.click()} disabled={fLoad} style={{ flex: 1 }}>
                    {fLoad ? <Spinner /> : '📄 Upload PDF (AI)'}
                  </button>
                </div>
                <input ref={xlRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) onExcel(e.target.files[0]); }} />
                <input ref={pdfRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) onPDF(e.target.files[0]); }} />
                {fMsg && (
                  <div style={{ fontSize: 13, padding: '7px 10px', borderRadius: 6, marginTop: 4, lineHeight: 1.4, color: fMsg.startsWith('✅') ? 'var(--g)' : fMsg.startsWith('⏳') ? 'var(--am)' : fMsg.startsWith('⚠️') ? 'var(--am)' : 'var(--re)', background: fMsg.startsWith('✅') ? 'rgba(0,220,114,.08)' : 'rgba(245,158,11,.06)' }}>{fMsg}</div>
                )}
                <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>Excel columns: Name, Role, Country, Base (price in ₹L). PDF is parsed by AI (requires ANTHROPIC_API_KEY in .env.local).</p>
              </div>

              {/* Player Pool */}
              <div className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2 }}>PLAYER POOL</div>
                  <span style={{ color: 'var(--g)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 14 }}>{players.length} players</span>
                </div>
                <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {players.map((p, i) => (
                    <div key={String(p.id) + i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', background: 'var(--bg3)', borderRadius: 7, border: '1px solid var(--bd)' }}>
                      <span style={{ fontSize: 14 }}>{p.nat || '🌍'}</span>
                      <span style={{ flex: 1, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      <RBadge role={p.role} />
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: 'var(--g)', letterSpacing: .5, margin: '0 4px' }}>₹{p.base}L</span>
                      <button onClick={() => setPlayers((ps) => ps.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 13, padding: '0 3px', lineHeight: 1 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn bs" onClick={() => setStep(2)} style={{ flex: 1 }}>← Back</button>
                <button className="btn bp" onClick={() => setStep(4)} style={{ flex: 2, fontSize: 15 }}>Next: Launch →</button>
              </div>
            </div>
          )}

          {/* STEP 4 — Launch */}
          {step === 4 && (() => {
            const getScheduleTs = () => {
              const d = new Date(`${scheduledDate}T${scheduledTime}`);
              return d.getTime();
            };
            const isScheduleValid = launchMode === 'now' || getScheduleTs() > Date.now() + 60000;
            const scheduleLabel = launchMode === 'schedule'
              ? new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
              : '';

            // Quick presets
            const presets = (() => {
              const today = new Date();
              const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
              const fmt = (d: Date) => d.toISOString().split('T')[0];
              return [
                { label: '☀️ Today 7 AM', date: fmt(today), time: '07:00' },
                { label: '🌙 Today 8 PM', date: fmt(today), time: '20:00' },
                { label: '🌅 Tomorrow 10 AM', date: fmt(tomorrow), time: '10:00' },
              ].filter(p => new Date(`${p.date}T${p.time}`).getTime() > Date.now() + 60000);
            })();

            return (
            <div key="s4" style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp .4s ease' }}>
              <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 68, color: 'var(--g)', letterSpacing: 4, marginBottom: 10 }}>READY!</div>
                <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 18, marginBottom: 18, border: '1px solid var(--bd2)' }}>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: 'var(--t3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5 }}>Invite Code</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: 4, color: 'var(--g)' }}>{roomId}</div>
                  <div style={{ color: 'var(--t3)', fontSize: 12, marginTop: 5 }}>Share this code with your friends to join</div>
                </div>
                {launchErr && (
                  <div style={{ fontSize: 13, padding: '9px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: 'var(--re)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 14 }}>
                    ⚠️ {launchErr}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20, textAlign: 'left' }}>
                  {[['🏏', cfg.sport], ['💰', `₹${cfg.budget}L per team`], ['📋', `${players.length} players`], ['⏱️', '30s timer · +20s per bid']].map(([icon, val]) => (
                    <div key={val} style={{ background: 'var(--bg3)', padding: '10px 13px', borderRadius: 8, border: '1px solid var(--bd)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: 'var(--t1)', fontSize: 13 }}>{icon} {val}</div>
                  ))}
                </div>

                {/* Launch Mode Toggle */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', gap: 3, background: 'var(--bg2)', borderRadius: 9, padding: 3, border: '1px solid var(--bd)', marginBottom: 14 }}>
                    <button
                      onClick={() => setLaunchMode('now')}
                      style={{
                        flex: 1, padding: '10px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                        background: launchMode === 'now' ? 'var(--g)' : 'transparent',
                        color: launchMode === 'now' ? '#000' : 'var(--t3)',
                        fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 14,
                        letterSpacing: .5, textTransform: 'uppercase', transition: 'all .25s',
                      }}>
                      🚀 Launch Now
                    </button>
                    <button
                      onClick={() => setLaunchMode('schedule')}
                      style={{
                        flex: 1, padding: '10px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                        background: launchMode === 'schedule' ? 'var(--am)' : 'transparent',
                        color: launchMode === 'schedule' ? '#000' : 'var(--t3)',
                        fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 14,
                        letterSpacing: .5, textTransform: 'uppercase', transition: 'all .25s',
                      }}>
                      🕐 Schedule
                    </button>
                  </div>

                  {/* Schedule Picker */}
                  {launchMode === 'schedule' && (
                    <div style={{ animation: 'fadeUp .3s ease', textAlign: 'left' }}>
                      <div className="card" style={{ padding: 18, border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--am)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
                          📅 Schedule Auction Start
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                          <div>
                            <Lbl>Date</Lbl>
                            <input
                              type="date"
                              className="inp"
                              value={scheduledDate}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              style={{ colorScheme: 'dark' }}
                            />
                          </div>
                          <div>
                            <Lbl>Time</Lbl>
                            <input
                              type="time"
                              className="inp"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              style={{ colorScheme: 'dark' }}
                            />
                          </div>
                        </div>

                        {/* Quick Presets */}
                        {presets.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <Lbl>Quick Select</Lbl>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {presets.map(p => (
                                <button
                                  key={p.label}
                                  className="btn bs bsm"
                                  onClick={() => { setScheduledDate(p.date); setScheduledTime(p.time); }}
                                  style={{
                                    background: scheduledDate === p.date && scheduledTime === p.time
                                      ? 'rgba(245,158,11,0.15)' : undefined,
                                    borderColor: scheduledDate === p.date && scheduledTime === p.time
                                      ? 'var(--am)' : undefined,
                                    color: scheduledDate === p.date && scheduledTime === p.time
                                      ? 'var(--am)' : undefined,
                                  }}>
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Preview */}
                        <div style={{
                          background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px',
                          border: '1px solid var(--bd)', textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 11, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>
                            Auction will auto-start at
                          </div>
                          <div style={{
                            fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 2,
                            color: isScheduleValid ? 'var(--am)' : 'var(--re)',
                          }}>
                            {isScheduleValid ? scheduleLabel : '⚠️ Select a future time'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button className="btn bp"
                  disabled={launching || (launchMode === 'schedule' && !isScheduleValid)}
                  style={{
                    width: '100%', fontSize: 18, padding: 15, letterSpacing: 2,
                    animation: (launchMode === 'schedule' && !isScheduleValid) ? 'none' : 'glow 2s infinite',
                    background: launchMode === 'schedule' ? 'var(--am)' : undefined,
                    boxShadow: launchMode === 'schedule' ? '0 4px 14px 0 rgba(245,158,11,0.15)' : undefined,
                  }}
                  onClick={async () => {
                    setLaunching(true);
                    setLaunchErr('');
                    try {
                      const scheduledAt = launchMode === 'schedule' ? getScheduleTs() : null;
                      const res = await fetch('/api/rooms', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          roomId,
                          name: cfg.name,
                          sport: cfg.sport,
                          tournament: cfg.tournament,
                          participants: cfg.participants,
                          budget: cfg.budget,
                          squadSize: cfg.squadSize,
                          enableBots: cfg.enableBots,
                          teams,
                          players,
                          hostId: userId,
                          scheduledAt,
                        })
                      });
                      const data = await res.json();
                      if (data.error) throw new Error(data.error);
                      
                      const hostTeamName = teams.find(t => t.id === 'you' || t.id === teams[0].id)?.name || 'Host';
                      onLaunch(data.room.id, 'you', hostTeamName);
                    } catch (e: any) {
                      setLaunchErr(e.message || 'Failed to launch room');
                    } finally {
                      setLaunching(false);
                    }
                  }}>
                  {launching
                    ? 'CREATING ROOM...'
                    : launchMode === 'schedule'
                      ? '🕐 SCHEDULE AUCTION'
                      : '🚀 LAUNCH AUCTION'}
                </button>
              </div>
              <button className="btn bs" onClick={() => setStep(3)} style={{ width: '100%' }}>← Back</button>
            </div>
          );})()}
        </div>
      </div>
    </div>
  );
}
