/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ESPN's public (key-less) scoreboard feed — the same data espn.com renders in
// its score strip. `fifa.world` is the FIFA World Cup competition.
const ESPN_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

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

function yyyymmdd(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    String(d.getUTCMonth() + 1).padStart(2, '0') +
    String(d.getUTCDate()).padStart(2, '0')
  );
}

function side(competitor: Record<string, any> | undefined): FixtureSide {
  const team = competitor?.team ?? {};
  return {
    name: String(team.displayName ?? team.name ?? ''),
    abbr: String(team.abbreviation ?? team.shortDisplayName ?? ''),
    score: competitor?.score != null ? String(competitor.score) : null,
    winner: competitor?.winner === true,
  };
}

export async function GET() {
  try {
    // Window from a few days back (to keep just-finished matches) through the
    // next ~6 weeks so the bar covers the live + upcoming fixtures.
    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 3);
    const end = new Date(now);
    end.setUTCDate(end.getUTCDate() + 45);

    const url = `${ESPN_SCOREBOARD}?dates=${yyyymmdd(start)}-${yyyymmdd(end)}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`ESPN responded ${res.status}`);

    const data = await res.json();
    const events: Record<string, any>[] = data.events ?? [];

    const fixtures: Fixture[] = events.map((e) => {
      const comp = e.competitions?.[0] ?? {};
      const competitors: Record<string, any>[] = comp.competitors ?? [];
      const home = competitors.find((c) => c.homeAway === 'home') ?? competitors[0];
      const away = competitors.find((c) => c.homeAway === 'away') ?? competitors[1];
      const status = e.status?.type ?? {};
      return {
        id: String(e.id),
        date: String(e.date),
        state: (status.state ?? 'pre') as Fixture['state'],
        detail: String(status.shortDetail ?? ''),
        note: String(comp.notes?.[0]?.headline ?? ''),
        home: side(home),
        away: side(away),
      };
    });

    // Chronological order, like ESPN's strip.
    fixtures.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ fixtures });
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return NextResponse.json({ fixtures: [], error: 'Failed to load fixtures' });
  }
}
