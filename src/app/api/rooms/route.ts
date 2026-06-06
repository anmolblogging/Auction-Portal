import { NextResponse } from 'next/server';
import { saveRoom } from '@/lib/db';
import { WC2026_PLAYERS } from '@/lib/wcSquads'; 

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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

export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
    
    const { 
      roomId, 
      name, 
      sport, 
      tournament,
      budget,
      squadSize,
      enableBots,
      teams, 
      players, 
      hostId, 
      scheduledAt
    } = reqBody;

    if (!name || !sport || !hostId || !teams) {
      return NextResponse.json({ error: 'Missing required room fields. Please check room name, sport, and host.' }, { status: 400 });
    }

    const finalRoomId = roomId || Math.random().toString(36).substring(2, 8).toUpperCase();
    const initialBudget = budget || 10000;

    const processedTeams: Record<string, any> = {};
    for (const [key, teamData] of Object.entries(teams)) {
        processedTeams[key] = {
            ...(teamData as any),
            budget: initialBudget 
        };
    }

    let finalizedPlayers = players || [];

    if (sport.toLowerCase().includes('football') || sport.toLowerCase().includes('fifa')) {
      const sourceDataset = finalizedPlayers.length > 0 ? finalizedPlayers : WC2026_PLAYERS;

      const processedPlayers = sourceDataset.map((player: any) => {
        const accurateTier = calculateHybridTier(player);
        let determinedBasePrice = 20; 
        if (accurateTier === 1) determinedBasePrice = 200;      
        if (accurateTier === 2) determinedBasePrice = 150;      
        if (accurateTier === 3) determinedBasePrice = 100;      
        if (accurateTier === 4) determinedBasePrice = 50;       
        if (accurateTier === 5) determinedBasePrice = 20;       

        return {
          ...player,
          tier: `Tier ${accurateTier}`, // FIX: This is now a string to stop React from crashing
          base: determinedBasePrice,    // FIX: Using 'base' so the frontend can read the price properly
          basePrice: determinedBasePrice,
          currentBid: 0,
          status: 'unsold'
        };
      });

      // Filter based on the newly formatted string 'Tier 1'
      const t1 = shuffleArray(processedPlayers.filter((p: any) => p.tier === 'Tier 1'));
      const t2 = shuffleArray(processedPlayers.filter((p: any) => p.tier === 'Tier 2'));
      const t3 = shuffleArray(processedPlayers.filter((p: any) => p.tier === 'Tier 3'));
      const t4 = shuffleArray(processedPlayers.filter((p: any) => p.tier === 'Tier 4'));
      const t5 = shuffleArray(processedPlayers.filter((p: any) => p.tier === 'Tier 5'));

      finalizedPlayers = [...t1, ...t2, ...t3, ...t4, ...t5];
    }
    
    // Safety Fallback if the array is empty for some reason
    if (!finalizedPlayers || finalizedPlayers.length === 0) {
       finalizedPlayers = [{ id: 'fallback-01', name: 'Database Loading Error', role: 'Unknown', country: 'Unknown', tier: 'Tier 5', base: 50, status: 'unsold', currentBid: 0 }];
    }

    const newRoom = {
      id: finalRoomId,
      name,
      sport,
      tournament: tournament || sport,
      budget: initialBudget,
      squadSize: squadSize || 15,
      enableBots: enableBots || false,
      hostId,
      participants: processedTeams, 
      players: finalizedPlayers,
      phase: scheduledAt ? 'scheduled' : 'lobby',
      playerIdx: 0,
      currentBid: 0,
      currentBidder: null,
      scheduledAt: scheduledAt || null,
      createdAt: Date.now(),
    };

    await saveRoom(newRoom);

    return NextResponse.json({ success: true, roomId: finalRoomId, room: newRoom });
  } catch (error: any) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const history: any[] = []; 

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Error fetching room history:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}