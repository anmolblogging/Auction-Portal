'use client';
import { useRef } from 'react';
import { Team } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

interface TeamCardProps {
  team: Team;
  onChange: (update: Partial<Team>) => void;
}

export default function TeamCard({ team, onChange }: TeamCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 18, border: `1px solid ${team.color}44`, textAlign: 'center' }}>
      <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
        <Avatar name={team.name} size={64} color={team.color} photo={team.photo} />
        <div style={{ position: 'absolute', bottom: 0, right: -2, width: 20, height: 20, borderRadius: '50%', background: 'var(--bg3)', border: `1px solid ${team.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: team.color }}>
          📷
        </div>
      </div>

      <input
        ref={fileRef} type="file" accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const rd = new FileReader();
          rd.onload = (ev) => onChange({ photo: ev.target?.result as string });
          rd.readAsDataURL(f);
        }}
      />

      <input
        className="inp"
        value={team.name}
        onChange={(e) => onChange({ name: e.target.value })}
        style={{ textAlign: 'center', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 14, padding: '7px 10px' }}
      />

      {team.id === 'you' && (
        <span style={{ fontSize: 10, color: 'var(--g)', fontFamily: "'Rajdhani', sans-serif", letterSpacing: 1, textTransform: 'uppercase' }}>
          ★ Your Team
        </span>
      )}
    </div>
  );
}
