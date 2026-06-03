'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { countryFlag } from '@/lib/flags';

interface FixtureSide {
  name: string;
  abbr: string;
  score: string | null;
  winner: boolean;
}

interface Fixture {
  id: string;
  date: string;
  state: 'pre' | 'in' | 'post';
  detail: string;
  note: string;
  home: FixtureSide;
  away: FixtureSide;
}

// "Sat, Jun 11 · 12:30 AM" in the viewer's locale/timezone.
function kickoff(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

function Team({ side, dim }: { side: FixtureSide; dim: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: dim ? 0.55 : 1 }}>
      <span style={{ fontSize: 14, lineHeight: 1 }}>{countryFlag(side.name)}</span>
      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 12, color: 'var(--t1)', letterSpacing: 0.5, minWidth: 30 }}>
        {side.abbr || side.name}
      </span>
      {side.score != null && (
        <span style={{ marginLeft: 'auto', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: side.winner ? 'var(--g)' : 'var(--t2)', letterSpacing: 1 }}>
          {side.score}
        </span>
      )}
    </div>
  );
}

function Card({ fx }: { fx: Fixture }) {
  const live = fx.state === 'in';
  const done = fx.state === 'post';
  const showScore = live || done;

  let status: ReactNode;
  if (live) {
    status = (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--re)', fontWeight: 700 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--re)', display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
        {fx.detail || 'LIVE'}
      </span>
    );
  } else if (done) {
    status = <span style={{ color: 'var(--t3)' }}>{fx.detail || 'FT'}</span>;
  } else {
    status = <span style={{ color: 'var(--t3)' }}>{kickoff(fx.date)}</span>;
  }

  return (
    <div
      style={{
        flex: '0 0 auto',
        minWidth: 158,
        padding: '7px 12px',
        borderRight: '1px solid var(--bd)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        justifyContent: 'center',
      }}
    >
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, whiteSpace: 'nowrap' }}>
        {status}
      </div>
      <Team side={fx.home} dim={showScore && fx.away.winner} />
      <Team side={fx.away} dim={showScore && fx.home.winner} />
    </div>
  );
}

export default function FixturesBar() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [filter, setFilter] = useState('all');
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty'>('loading');

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch('/api/fixtures')
        .then((r) => r.json())
        .then((d) => {
          if (!active) return;
          const list: Fixture[] = d.fixtures ?? [];
          setFixtures(list);
          setStatus(list.length ? 'ready' : 'empty');
        })
        .catch(() => active && setStatus('empty'));
    load();
    const iv = setInterval(load, 60000); // refresh scores every minute
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, []);

  const teams = useMemo(() => {
    const set = new Set<string>();
    fixtures.forEach((f) => {
      if (f.home.name) set.add(f.home.name);
      if (f.away.name) set.add(f.away.name);
    });
    return Array.from(set).sort();
  }, [fixtures]);

  const shown = useMemo(
    () =>
      filter === 'all'
        ? fixtures
        : fixtures.filter((f) => f.home.name === filter || f.away.name === filter),
    [fixtures, filter]
  );

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', background: 'var(--bg2)', borderBottom: '1px solid var(--bd)', height: 56 }}>
      {/* Filter / label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderRight: '1px solid var(--bd)', background: 'var(--bg)', flexShrink: 0 }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, color: 'var(--g)', letterSpacing: 1.5, whiteSpace: 'nowrap' }}>
          WC 2026
        </span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter fixtures by team or country"
          style={{
            background: 'var(--bg3)',
            color: 'var(--t1)',
            border: '1px solid var(--bd)',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
            maxWidth: 150,
            cursor: 'pointer',
          }}
        >
          <option value="all">All teams</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {countryFlag(t)} {t}
            </option>
          ))}
        </select>
      </div>

      {/* Scrollable fixtures strip */}
      <div style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto', flex: 1, scrollbarWidth: 'thin' }}>
        {status === 'loading' && (
          <span style={{ alignSelf: 'center', padding: '0 16px', fontSize: 12, color: 'var(--t3)', fontFamily: "'Rajdhani', sans-serif" }}>
            Loading fixtures…
          </span>
        )}
        {status === 'empty' && (
          <span style={{ alignSelf: 'center', padding: '0 16px', fontSize: 12, color: 'var(--t3)', fontFamily: "'Rajdhani', sans-serif" }}>
            Fixtures unavailable right now.
          </span>
        )}
        {status === 'ready' && shown.length === 0 && (
          <span style={{ alignSelf: 'center', padding: '0 16px', fontSize: 12, color: 'var(--t3)', fontFamily: "'Rajdhani', sans-serif" }}>
            No fixtures for {filter}.
          </span>
        )}
        {shown.map((fx) => (
          <Card key={fx.id} fx={fx} />
        ))}
      </div>
    </div>
  );
}
