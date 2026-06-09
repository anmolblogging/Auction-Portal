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
    const initialBudget = budget || 1000000000;

    const processedTeams: Record<string, any> = {};
    for (const [key, teamData] of Object.entries(teams)) {
        processedTeams[key] = {
            ...(teamData as any),
            budget: initialBudget 
        };
    }

    let finalizedPlayers = players || [];

    // If client sent their own players (via CreateRoom.tsx), DO NOT OVERWRITE THEIR VALUES
    if (finalizedPlayers.length > 0) {
        finalizedPlayers = finalizedPlayers.map((player: any) => ({
           ...player,
           basePrice: player.base || player.basePrice || 5000000,
           currentBid: 0,
           status: 'unsold'
        }));
    } else {
        // Only load default dataset if client somehow sent 0 players
        if (sport.toLowerCase().includes('football') || sport.toLowerCase().includes('fifa')) {
          const sourceDataset = WC2026_PLAYERS || [];
          finalizedPlayers = sourceDataset.map((player: any) => {
            const accurateTier = calculateHybridTier(player);
            let determinedBasePrice = 2000000; 
            if (accurateTier === 1) determinedBasePrice = 20000000;      
            if (accurateTier === 2) determinedBasePrice = 15000000;      
            if (accurateTier === 3) determinedBasePrice = 10000000;      
            if (accurateTier === 4) determinedBasePrice = 5000000;       

            return {
              ...player,
              tier: `Tier ${accurateTier}`,
              base: determinedBasePrice,
              basePrice: determinedBasePrice,
              currentBid: 0,
              status: 'unsold'
            };
          });
        }
    }

    // Safely Shuffle Based on Tiers (if tiers exist)
    const hasTiers = finalizedPlayers.some((p: any) => p.tier && p.tier.toString().trim() !== '');
    if (hasTiers) {
        const t1 = shuffleArray(finalizedPlayers.filter((p: any) => p.tier === 'Tier 1' || p.tier === '1'));
        const t2 = shuffleArray(finalizedPlayers.filter((p: any) => p.tier === 'Tier 2' || p.tier === '2'));
        const t3 = shuffleArray(finalizedPlayers.filter((p: any) => p.tier === 'Tier 3' || p.tier === '3'));
        const t4 = shuffleArray(finalizedPlayers.filter((p: any) => p.tier === 'Tier 4' || p.tier === '4'));
        const t5 = shuffleArray(finalizedPlayers.filter((p: any) => p.tier === 'Tier 5' || p.tier === '5'));
        const noT = shuffleArray(finalizedPlayers.filter((p: any) => !p.tier || p.tier.toString().trim() === ''));
        finalizedPlayers = [...t1, ...t2, ...t3, ...t4, ...t5, ...noT];
    } else {
        finalizedPlayers = shuffleArray(finalizedPlayers);
    }
    
    // Safety Fallback
    if (!finalizedPlayers || finalizedPlayers.length === 0) {
       finalizedPlayers = [{ id: 'fallback-01', name: 'Database Loading Error', role: 'Unknown', country: 'Unknown', tier: '', base: 5000000, status: 'unsold', currentBid: 0 }];
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