'use client';
import { useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Player, RoomConfig } from '@/lib/types';
import Image from 'next/image';
import { buildDefaultTeams, getPlayersForSport } from '@/lib/data';
import Avatar from '@/components/ui/Avatar';
import { RBadge, TBadge } from '@/components/ui/Badges';
import Spinner from '@/components/ui/Spinner';
import { playerFlag } from '@/lib/flags';

const formatCurrency = (lakhs: number | string | null | undefined) => {
  const num = Number(lakhs);
  if (isNaN(num)) return '₹0L';
  if (num >= 10000000) {
    const cr = num / 10000000;
    return `₹${Number.isInteger(cr) ? cr : cr.toFixed(2)}Cr`;
  }
  if (num >= 100000) {
    const lk = num / 100000;
    return `₹${Number.isInteger(lk) ? lk : lk.toFixed(2)}L`;
  }
  return `₹${num.toLocaleString()}`;
};

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

// isCustom prevents the system from overwriting manual/excel inputs
function applySportRules(sport: string, rawPlayers: Player[], isCustom: boolean = false): Player[] {
  return rawPlayers.map(p => {
    let finalTier = p.tier;
    let finalBase = p.base;

    // Only apply the Hybrid tier logic if we are loading the DEFAULT Football dataset
    if (sport.toLowerCase().includes('football') && !isCustom) {
        const tierNum = calculateHybridTier(p);
        finalTier = `Tier ${tierNum}`;
        if (finalBase < 100000) {
           if (tierNum === 1) finalBase = 20000000;
           else if (tierNum === 2) finalBase = 15000000;
           else if (tierNum === 3) finalBase = 10000000;
           else if (tierNum === 4) finalBase = 5000000;
           else finalBase = 2000000;
        }
    }

    // Convert legacy low values (like 50L) to absolute values 
    if (finalBase < 100000) {
        finalBase = finalBase * 100000;
    }

    return { ...p, tier: finalTier || '', base: finalBase };
  });
}

interface CreateRoomProps {
  userId: string;
  onLaunch: (roomId: string, teamId: string, userName: string) => void;
  onBack: () => void;
}

// SIMPLIFIED SPORT OPTIONS
const SPORT_OPTIONS = ['Cricket', 'Football'];

function getDefaultTournament(sport: string) {
  if (sport.includes('Cricket')) return 'T20 League';
  if (sport.includes('Football')) return 'World Cup';
  return 'Tournament';
}
function getRoleOptions(sport: string) {
  if (sport.includes('Football')) return ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];
  return ['Batter', 'Bowler', 'All-rounder', 'Wicketkeeper'];
}
function makeInitials(name: string) {
  return name.split(' ').map((w) => w[0] || '').join('').slice(0, 3).toUpperCase();
}
function Lbl({ children }: { children: ReactNode }) {
  return <label style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{children}</label>;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}><Lbl>{label}</Lbl>{children}</div>;
}

export default function CreateRoom({ userId, onLaunch, onBack }: CreateRoomProps) {
  const [step, setStep] = useState(1);
  const [roomId] = useState(() => `AUC-${Math.floor(1000 + Math.random() * 9000)}`);
  const [clientNow, setClientNow] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => { setClientNow(Date.now()); }, []);
  
  const [cfg, setCfg] = useState<RoomConfig & { enableBots: boolean }>({
    name: 'Mega Auction 2026', sport: 'Cricket', tournament: 'T20 League', participants: 4, budget: 1000000000, squadSize: 15, enableBots: true,
  });

  const [players, setPlayers] = useState<Player[]>(() => applySportRules('Cricket', getPlayersForSport('Cricket - IPL'), false));
  const [isCustomPool, setIsCustomPool] = useState(false); 
  const [hostTeamName, setHostTeamName] = useState('Your Team');
  const [hostTeamPhoto, setHostTeamPhoto] = useState<string | null>(null);
  
  const [fLoad, setFLoad] = useState(false);
  const [fMsg, setFMsg] = useState('');
  const [launching, setLaunching] = useState(false);
  const [launchErr, setLaunchErr] = useState('');
  const [launchMode, setLaunchMode] = useState<'now' | 'schedule'>('now');

  const defaults = (() => {
    const d = new Date(); d.setHours(d.getHours() + 1); d.setMinutes(d.getMinutes() >= 30 ? 0 : 30, 0, 0);
    return { date: d.toISOString().split('T')[0], time: d.toTimeString().slice(0, 5) };
  })();
  const [scheduledDate, setScheduledDate] = useState(defaults.date);
  const [scheduledTime, setScheduledTime] = useState(defaults.time);
  
  // Updated Manual Player State 
  const [manualP, setManualP] = useState({ name: '', role: getRoleOptions('Cricket')[0], country: '', base: '', tier: '' });

  const xlRef = useRef<HTMLInputElement>(null);
  const hostPhotoRef = useRef<HTMLInputElement>(null);
  const roleOptions = getRoleOptions(cfg.sport);

  function handleSportChange(sport: string) {
    setCfg((prev) => ({ ...prev, sport, tournament: getDefaultTournament(sport) }));
    setPlayers(applySportRules(sport, getPlayersForSport(sport === 'Cricket' ? 'Cricket - IPL' : 'Football - FIFA'), false));
    setIsCustomPool(false); setFMsg(''); 
    setManualP({ name: '', role: getRoleOptions(sport)[0], country: '', base: '', tier: '' });
  }

  function saveManualPlayer() {
    if (!manualP.name.trim() || !manualP.base.trim()) return;
    setPlayers((prev) => {
      const newP = { 
        id: Date.now(), 
        name: manualP.name.trim(), 
        role: manualP.role, 
        country: manualP.country.trim() || 'Free Agent', 
        nat: '🌍', 
        tier: manualP.tier ? `Tier ${manualP.tier}` : '', 
        base: parseInt(manualP.base.replace(/\D/g, ''), 10) || 5000000, 
        img: makeInitials(manualP.name) 
      };
      if (!isCustomPool) { setIsCustomPool(true); return applySportRules(cfg.sport, [newP], true); }
      return applySportRules(cfg.sport, [...prev, newP], true);
    });
    setManualP({ name: '', role: roleOptions[0], country: '', base: '', tier: '' });
  }

  function downloadSampleExcel() {
    const isFootball = cfg.sport.toLowerCase().includes('football');
    const header = "Name,Role,Country,Base Price,Tier\n";
    const row1 = isFootball ? "Lionel Messi,Forward,Argentina,20000000,1\n" : "MS Dhoni,Wicketkeeper,India,20000000,1\n";
    const row2 = isFootball ? "Jude Bellingham,Midfielder,England,15000000,2\n" : "Virat Kohli,Batter,India,20000000,1\n";
    const row3 = isFootball ? "William Saliba,Defender,France,10000000,3\n" : "Jasprit Bumrah,Bowler,India,15000000,2\n";
    
    const csvContent = header + row1 + row2 + row3;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Kola_Draft_Sample_Players.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function onExcel(file: File) {
    setFLoad(true); setFMsg('⏳ Reading Excel…');
    try {
      type XlsxModule = typeof import('xlsx');
      const xlsxModule = (await import('xlsx')) as XlsxModule & { default?: XlsxModule };
      const XLSX = xlsxModule.default ?? xlsxModule;
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
      
      const parsedPlayers: Player[] = rows.map((row, index) => {
        const rawTier = String(row.Tier || row.tier || '').replace(/\D/g, '');
        return {
          id: Date.now() + index,
          name: String(row.Name || row.name || row.Player || row.player || ''),
          role: String(row.Role || row.role || row.Position || roleOptions[0]),
          country: String(row.Country || row.country || row.League || 'Free Agent'),
          nat: String(row.nat || row.Emoji || row.Flag || '🌍'),
          tier: rawTier ? `Tier ${rawTier}` : '',
          base: parseInt(String(row.Base || row.base || row['Base Price'] || row.Price || 5000000), 10) || 5000000,
          img: makeInitials(String(row.Name || row.name || 'XX')),
        };
      }).filter((player) => player.name);

      setPlayers((prev) => {
        if (!isCustomPool) { setIsCustomPool(true); return applySportRules(cfg.sport, parsedPlayers, true); }
        return applySportRules(cfg.sport, [...prev, ...parsedPlayers], true);
      });
      setFMsg(`✅ Added ${parsedPlayers.length} players from Excel`);
    } catch (e: unknown) { setFMsg(`❌ ${e instanceof Error ? e.message : 'Error reading file'}`); }
    setFLoad(false); if (xlRef.current) xlRef.current.value = '';
  }

  const stepList = [ { n: 1, l: 'Setup' }, { n: 2, l: 'Players' }, { n: 3, l: 'Launch' } ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .global-sticky-header { position: sticky; top: 0; z-index: 10000; background: rgba(5, 7, 14, 0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--bd); flex-shrink: 0; }
        .nav-container { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; flex-wrap: wrap; }
        .desktop-nav { display: flex; gap: 12px; align-items: center; }
        .mobile-menu-btn { display: none; background: transparent; border: none; color: var(--t1); font-size: 24px; cursor: pointer; padding: 0 8px; }
        .mobile-nav { display: none; width: 100%; flex-direction: column; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--bd2); }
        .nav-link { background: transparent; border: none; color: var(--t2); font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; padding: 8px 12px; border-radius: 6px; transition: all 0.2s; text-align: left; }
        .nav-link:hover { color: var(--t1); background: var(--bg3); }
        @media (max-width: 800px) { .desktop-nav { display: none !important; } .mobile-menu-btn { display: block; } .mobile-nav.open { display: flex; } }
      `}} />

      {/* UNIVERSAL MENU BAR */}
      <header className="global-sticky-header">
        <nav className="nav-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ cursor: 'pointer' }} onClick={onBack}>
              <Image src="/kolacommunications.svg" alt="Kola Logo" width={100} height={26} style={{ height: 26, width: 'auto', filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.5))' }} priority />
            </div>
            <span className="hide-mobile" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--t2)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', fontSize: 11, borderRadius: 6, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>Room Setup</span>
          </div>
          <div className="desktop-nav">
            <button className="nav-link" onClick={() => window.open('/', '_blank')}>🏆 Quiz ↗</button>
            <button className="nav-link" onClick={() => window.open('/', '_blank')}>👕 Squads ↗</button>
            <button className="nav-link" onClick={() => window.open('/', '_blank')}>📅 Fixtures ↗</button>
          </div>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
          {isMobileMenuOpen && (
            <div className="mobile-nav open">
              <button className="nav-link" onClick={() => { setIsMobileMenuOpen(false); window.open('/', '_blank'); }}>🏆 Quiz ↗</button>
              <button className="nav-link" onClick={() => { setIsMobileMenuOpen(false); window.open('/', '_blank'); }}>👕 Squads ↗</button>
              <button className="nav-link" onClick={() => { setIsMobileMenuOpen(false); window.open('/', '_blank'); }}>📅 Fixtures ↗</button>
            </div>
          )}
        </nav>
      </header>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '32px 18px' }}>
        <div style={{ width: '100%', maxWidth: 720 }}>
          <div style={{ display: 'flex', gap: 3, marginBottom: 28, background: 'var(--bg2)', borderRadius: 9, padding: 3, border: '1px solid var(--bd)' }}>
            {stepList.map((item) => (
              <button key={item.n} onClick={() => { if (item.n < step) setStep(item.n); }} style={{ flex: 1, padding: 8, borderRadius: 7, border: 'none', cursor: item.n <= step ? 'pointer' : 'default', background: step === item.n ? 'var(--g)' : 'transparent', color: step === item.n ? '#000' : step > item.n ? 'var(--t2)' : 'var(--t3)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase', transition: 'all .2s' }}>
                {item.n}. {item.l}
              </button>
            ))}
          </div>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp .4s ease' }}>
              <div className="card" style={{ padding: 22 }}>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, letterSpacing: 2, marginBottom: 20 }}>ROOM SETUP</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Room Name">
                    <input className="inp" value={cfg.name} onChange={(e) => setCfg({ ...cfg, name: e.target.value })} />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Sport">
                      <select className="inp" value={cfg.sport} onChange={(e) => handleSportChange(e.target.value)}>
                        {SPORT_OPTIONS.map((sport) => <option key={sport}>{sport}</option>)}
                      </select>
                    </Field>
                    <Field label="Tournament">
                      <input className="inp" value={cfg.tournament} onChange={(e) => setCfg({ ...cfg, tournament: e.target.value })} />
                    </Field>
                  </div>
                  <div className="three-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <Field label="Participants">
                      <input className="inp" type="number" min={2} max={12} value={cfg.participants} onChange={(e) => setCfg({ ...cfg, participants: parseInt(e.target.value, 10) || 2 })} />
                    </Field>
                    <Field label="Budget (₹)">
                      <input className="inp" type="number" placeholder="e.g. 1000000000" value={cfg.budget} onChange={(e) => setCfg({ ...cfg, budget: parseInt(e.target.value, 10) || 1000000000 })} />
                    </Field>
                    <Field label="Squad Size">
                      <input className="inp" type="number" value={cfg.squadSize} onChange={(e) => setCfg({ ...cfg, squadSize: parseInt(e.target.value, 10) || 15 })} />
                    </Field>
                  </div>
                  <Field label="CPU Bots Bidding">
                    <select className="inp" value={cfg.enableBots ? 'Enabled' : 'Disabled'} onChange={(e) => setCfg({ ...cfg, enableBots: e.target.value === 'Enabled' })}>
                      <option value="Enabled">Enabled (Bots bid automatically)</option>
                      <option value="Disabled">Disabled (Only real players bid)</option>
                    </select>
                  </Field>
                  <div className="card" style={{ padding: 18, border: '1px solid rgba(0,220,114,0.14)', background: 'rgba(0,220,114,0.04)' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 1.5, marginBottom: 12 }}>HOST TEAM</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, alignItems: 'center' }}>
                      <div style={{ cursor: 'pointer' }} onClick={() => hostPhotoRef.current?.click()}>
                        <Avatar name={hostTeamName || 'Your Team'} size={72} color="#00DC72" photo={hostTeamPhoto} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Field label="Your Team Name">
                          <input className="inp" value={hostTeamName} onChange={(e) => setHostTeamName(e.target.value)} placeholder="Enter your team name" />
                        </Field>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn bs bsm" type="button" onClick={() => hostPhotoRef.current?.click()}>Upload Logo</button>
                          {hostTeamPhoto && <button className="btn bs bsm" type="button" onClick={() => setHostTeamPhoto(null)}>Remove Logo</button>}
                        </div>
                        <input ref={hostPhotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event) => { setHostTeamPhoto((event.target?.result as string) || null); }; reader.readAsDataURL(file); }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn bs" onClick={onBack} style={{ flex: 1 }}>← Back to Home</button>
                <button className="btn bp" onClick={() => setStep(2)} style={{ flex: 2, fontSize: 15, padding: 13 }}>Next: Player Pool →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp .4s ease' }}>
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, marginBottom: 12 }}>➕ ADD PLAYERS</div>
                
                {/* MANUAL PLAYER ADDITION */}
                <div style={{ padding: 16, background: 'rgba(0,220,114,0.05)', border: '1px solid var(--g)', borderRadius: 10 }}>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--g)' }}>ADD SINGLE PLAYER</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input className="inp" placeholder="Player Name" value={manualP.name} onChange={(e) => setManualP({ ...manualP, name: e.target.value })} />
                    <select className="inp" value={manualP.role} onChange={(e) => setManualP({ ...manualP, role: e.target.value })}>
                      {roleOptions.map((role) => <option key={role}>{role}</option>)}
                    </select>
                    <input className="inp" placeholder="Country / League" value={manualP.country} onChange={(e) => setManualP({ ...manualP, country: e.target.value })} />
                    <input className="inp" type="number" placeholder="Base Price (e.g. 10000000)" value={manualP.base} onChange={(e) => setManualP({ ...manualP, base: e.target.value })} />
                    <select className="inp" value={manualP.tier} onChange={(e) => setManualP({ ...manualP, tier: e.target.value })} style={{ gridColumn: 'span 2' }}>
                      <option value="">Tier (Optional - Leave blank if unused)</option>
                      <option value="1">Tier 1</option>
                      <option value="2">Tier 2</option>
                      <option value="3">Tier 3</option>
                      <option value="4">Tier 4</option>
                      <option value="5">Tier 5</option>
                    </select>
                  </div>
                  <button className="btn bp" onClick={saveManualPlayer} style={{ width: '100%', marginTop: 10 }}>+ Add Player to Pool</button>
                </div>

                {/* BULK UPLOAD EXCEL */}
                <div style={{ marginTop: 24, borderTop: '1px solid var(--bd2)', paddingTop: 18 }}>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--t1)' }}>BULK UPLOAD (EXCEL/CSV)</div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <button className="btn bs" onClick={() => xlRef.current?.click()} disabled={fLoad} style={{ flex: 1 }}>📊 Upload .xlsx / .csv</button>
                    <button className="btn bs" onClick={downloadSampleExcel} style={{ flex: 1, borderColor: 'var(--g)', color: 'var(--g)' }}>📥 Download Sample</button>
                  </div>
                  <input ref={xlRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) onExcel(e.target.files[0]); }} />
                  {fMsg && (
                    <div style={{ fontSize: 13, padding: '7px 10px', borderRadius: 6, marginTop: 4, lineHeight: 1.4, color: fMsg.startsWith('✅') ? 'var(--g)' : 'var(--re)', background: fMsg.startsWith('✅') ? 'rgba(0,220,114,.08)' : 'rgba(239,68,68,.08)' }}>{fMsg}</div>
                  )}
                </div>
              </div>

              <div className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2 }}>PLAYER POOL</div>
                  <span style={{ color: 'var(--g)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 14 }}>{cfg.sport} · {players.length} players</span>
                </div>
                <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {players.map((player, index) => (
                    <div key={String(player.id) + index} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', background: 'var(--bg3)', borderRadius: 7, border: '1px solid var(--bd)' }}>
                      <span style={{ flex: 1, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</span>
                      <RBadge role={player.role} />
                      {player.tier && (
                        <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--bd)', padding: '2px 6px', borderRadius: 4, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase' }}>
                          T{player.tier.replace(/\D/g, '') || player.tier}
                        </span>
                      )}
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: 'var(--g)', letterSpacing: 0.5, margin: '0 4px' }}>{formatCurrency(player.base)}</span>
                      <button onClick={() => setPlayers((prev) => prev.filter((_, i) => i !== index))} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 13, padding: '0 3px' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn bs" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
                <button className="btn bp" onClick={() => setStep(3)} style={{ flex: 2, fontSize: 15 }}>Next: Launch →</button>
              </div>
            </div>
          )}

          {step === 3 && (() => {
            const getScheduleTs = () => new Date(`${scheduledDate}T${scheduledTime}`).getTime();
            const isScheduleValid = launchMode === 'now' || (clientNow !== null && getScheduleTs() > clientNow + 60000);
            const scheduleLabel = launchMode === 'schedule' ? new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '';

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp .4s ease' }}>
                <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 68, color: 'var(--g)', letterSpacing: 4, marginBottom: 10 }}>READY!</div>
                  <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 18, marginBottom: 18, border: '1px solid var(--bd2)' }}>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: 'var(--t3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5 }}>Invite Code</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: 4, color: 'var(--g)' }}>{roomId}</div>
                  </div>

                  {launchErr && <div style={{ fontSize: 13, padding: '9px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: 'var(--re)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 14 }}>⚠️ {launchErr}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20, textAlign: 'left' }}>
                    {[ ['🏏', cfg.sport], ['💰', `${formatCurrency(cfg.budget)} per team`], ['📋', `${players.length} players`], ['⏱️', '30s timer · +15s per bid'] ].map(([icon, value]) => (
                      <div key={value} style={{ background: 'var(--bg3)', padding: '10px 13px', borderRadius: 8, border: '1px solid var(--bd)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: 'var(--t1)', fontSize: 13 }}>
                        {icon} {value}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', gap: 3, background: 'var(--bg2)', borderRadius: 9, padding: 3, border: '1px solid var(--bd)', marginBottom: 14 }}>
                      <button onClick={() => setLaunchMode('now')} style={{ flex: 1, padding: '10px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', background: launchMode === 'now' ? 'var(--g)' : 'transparent', color: launchMode === 'now' ? '#000' : 'var(--t3)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>🚀 Launch Now</button>
                      <button onClick={() => setLaunchMode('schedule')} style={{ flex: 1, padding: '10px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', background: launchMode === 'schedule' ? 'var(--am)' : 'transparent', color: launchMode === 'schedule' ? '#000' : 'var(--t3)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>🕐 Schedule</button>
                    </div>

                    {launchMode === 'schedule' && (
                      <div className="card" style={{ padding: 18, border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                          <div><Lbl>Date</Lbl><input type="date" className="inp" value={scheduledDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setScheduledDate(e.target.value)} /></div>
                          <div><Lbl>Time</Lbl><input type="time" className="inp" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} /></div>
                        </div>
                        <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 2, color: isScheduleValid ? 'var(--am)' : 'var(--re)' }}>{isScheduleValid ? scheduleLabel : '⚠️ Select a future time'}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button className="btn bp" disabled={launching || !hostTeamName.trim() || (launchMode === 'schedule' && !isScheduleValid)} style={{ width: '100%', fontSize: 18, padding: 15, background: launchMode === 'schedule' ? 'var(--am)' : undefined }}
                    onClick={async () => {
                      setLaunching(true); setLaunchErr('');
                      
                      // TIER RULE VALIDATION
                      const hasTiers = players.some(p => p.tier && p.tier.toString().trim() !== '');
                      const allHaveTiers = players.every(p => p.tier && p.tier.toString().trim() !== '');
                      if (hasTiers && !allHaveTiers) {
                        setLaunchErr('Tier Rule: If you assign a tier to one player, you must assign a tier to ALL players in the pool.');
                        setLaunching(false);
                        return;
                      }

                      try {
                        const scheduledAt = launchMode === 'schedule' ? getScheduleTs() : null;
                        const teams = buildDefaultTeams(cfg.participants, hostTeamName.trim() || 'Host Team', hostTeamPhoto);
                        const res = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, name: cfg.name, sport: cfg.sport, tournament: cfg.tournament, participants: cfg.participants, budget: cfg.budget, squadSize: cfg.squadSize, enableBots: cfg.enableBots, teams, players, hostId: userId, scheduledAt }) });
                        const data = await res.json();
                        if (data.error) throw new Error(data.error);
                        onLaunch(data.room.id, 'you', hostTeamName.trim() || 'Host Team');
                      } catch (e: unknown) { setLaunchErr(e instanceof Error ? e.message : 'Failed to launch'); } 
                      finally { setLaunching(false); }
                    }}>
                    {launching ? 'CREATING...' : launchMode === 'schedule' ? '🕐 SCHEDULE' : '🚀 LAUNCH'}
                  </button>
                </div>
                <button className="btn bs" onClick={() => setStep(2)} style={{ width: '100%' }}>← Back</button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}