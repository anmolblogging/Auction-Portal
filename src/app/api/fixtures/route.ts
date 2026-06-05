// src/app/api/fixtures/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  // GRACEFUL FALLBACK DATA
  if (!apiKey) {
    return NextResponse.json({
      fixtures: [
        { id: 101, matchNumber: 1, team1: 'Mexico', team2: 'South Africa', datetime: '2026-06-11T22:30:00Z', venue: 'Estadio Azteca, Mexico City', stage: 'Group Stage - Group A', status: 'TIMED', score1: null, score2: null },
        { id: 102, matchNumber: 2, team1: 'Canada', team2: 'Bosnia-Herzegovina', datetime: '2026-06-12T19:00:00Z', venue: 'BMO Field, Toronto', stage: 'Group Stage - Group B', status: 'TIMED', score1: null, score2: null },
        { id: 103, matchNumber: 3, team1: 'USA', team2: 'Paraguay', datetime: '2026-06-12T21:00:00Z', venue: 'SoFi Stadium, Los Angeles', stage: 'Group Stage - Group D', status: 'TIMED', score1: null, score2: null }
      ],
      standings: [
        {
          group: 'Group A',
          table: [
            { position: 1, team: { name: 'Mexico' }, playedGames: 0, points: 0, goalDifference: 0 },
            { position: 2, team: { name: 'South Africa' }, playedGames: 0, points: 0, goalDifference: 0 }
          ]
        }
      ],
      isFallback: true
    });
  }

  try {
    // Fetch Matches and Standings in parallel
    const [matchesRes, standingsRes] = await Promise.all([
      fetch('https://api.football-data.org/v4/competitions/WC/matches', {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 1800 }
      }),
      fetch('https://api.football-data.org/v4/competitions/WC/standings', {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 1800 }
      })
    ]);

    if (!matchesRes.ok || !standingsRes.ok) {
      throw new Error(`External API connection error. Matches status: ${matchesRes.status}, Standings status: ${standingsRes.status}`);
    }

    const matchesData = await matchesRes.json();
    const standingsData = await standingsRes.json();

    // Chronologically sort matches to accurately compute chronological match numbers (1 to 104)
    const sortedMatches = (matchesData.matches || []).sort(
      (a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    );

    const formattedFixtures = sortedMatches.map((match: any, index: number) => {
      const rawStage = match.stage ? match.stage.toLowerCase().replace('_', ' ') : 'group stage';
      const cleanStage = rawStage.replace(/\b\w/g, (l: string) => l.toUpperCase());
      const groupInfo = match.group ? ` - ${match.group.replace('_', ' ')}` : '';

      return {
        id: match.id,
        matchNumber: index + 1, // Calculated chronological indicator
        team1: match.homeTeam?.name || 'TBD',
        team2: match.awayTeam?.name || 'TBD',
        team1Logo: match.homeTeam?.crest || null,
        team2Logo: match.awayTeam?.crest || null,
        datetime: match.utcDate,
        venue: match.venue || 'To Be Announced',
        stage: `${cleanStage}${groupInfo}`,
        status: match.status,
        score1: match.score?.fullTime?.home ?? null,
        score2: match.score?.fullTime?.away ?? null
      };
    });

    // Format group standings table maps cleanly
    const formattedStandings = (standingsData.standings || []).map((g: any) => ({
      group: g.group ? g.group.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Unknown Group',
      table: (g.table || []).map((row: any) => ({
        position: row.position,
        team: {
          name: row.team?.name || 'TBD',
          crest: row.team?.crest || null
        },
        playedGames: row.playedGames || 0,
        points: row.points || 0,
        goalDifference: row.goalDifference ?? 0
      }))
    }));

    return NextResponse.json({ fixtures: formattedFixtures, standings: formattedStandings, isFallback: false });

  } catch (error: any) {
    console.error('Error fetching data from Football-Data:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}