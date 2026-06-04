import { NextResponse } from 'next/server';
import { saveRoom } from '@/lib/db';
import { WC2026_PLAYERS } from '@/lib/wcSquads'; 

// Helper function to shuffle arrays randomly (Fisher-Yates Shuffle)
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 1. Hybrid Classifier: Fantasy Output Model + Nation Odds Model
function calculateHybridTier(player: any): number {
  // Read properties matching your specific wcSquads.ts structure
  const team = (player.country || player.nationality || '').toLowerCase().trim();
  const position = (player.role || player.position || '').toLowerCase().trim();

  // Extract the original Market Value tier ("Tier 1" -> 1) as a baseline indicator of player quality
  const mvTier = typeof player.tier === 'string' ? parseInt(player.tier.replace(/\D/g, '')) || 5 : (player.tier || 5);

  // A. NATION ODDS: Grouping teams by tournament depth expectations
  const tier1Teams = ['argentina', 'france', 'england', 'brazil', 'spain', 'germany', 'portugal'];
  const tier2Teams = ['netherlands', 'italy', 'belgium', 'uruguay', 'croatia', 'morocco', 'colombia'];

  let teamFactor = 3; // Default for mid/lower tier nations
  if (tier1Teams.includes(team)) teamFactor = 1;
  else if (tier2Teams.includes(team)) teamFactor = 2;

  // B. FANTASY OUTPUT: Positional impact
  const isAttacker = position.includes('forward') || position.includes('st') || position.includes('winger') || position.includes('attack');
  const isMidfielder = position.includes('midfield') || position.includes('cam') || position.includes('cm');

  // Proxy for "Marquee/Elite" using original market value tiers
  const isMarquee = mvTier === 1;
  const isElite = mvTier === 2;

  // C. HYBRID RULE MATCHING
  // Tier 1: Premium / Captaincy Options (Elite attackers/Marquee from top contending nations)
  if (teamFactor === 1 && (isAttacker || isMarquee)) {
    return 1;
  }

  // Tier 2: Elite Starters (Marquee from mid-tier nations, or Elite starters from top nations)
  if ((teamFactor === 1 && (isMidfielder || isElite)) || (teamFactor === 2 && (isAttacker || isMarquee))) {
    return 2;
  }

  // Tier 3: The Core (Solid starting depth from Top/Mid nations, or top-tier defenders from Tier 1 nations)
  if (teamFactor <= 2 || (teamFactor === 3 && (isAttacker || isMarquee)) || (teamFactor === 1 && position.includes('def'))) {
    return 3;
  }

  // Tier 4: Enablers (Budget-friendly rotation players or defensive assets from low odds nations)
  if (teamFactor === 3 || position.includes('def') || position.includes('goalkeeper') || position.includes('gk')) {
    return 4;
  }

  // Tier 5: Fodder / Gambles (Low rating, deep bench options, or long-shot squads)
  return 5;
}

export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
    const { name, sport, participants, squadSize, creatorId, config } = reqBody;

    if (!name || !sport || !participants || !creatorId) {
      return NextResponse.json({ error: 'Missing required room fields' }, { status: 400 });
    }

    // NATIVE ID GENERATION: Replaces the need for 'uuid' dependency
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Flexible Budget: Defaults to 100 Cr (10000 Lakhs)
    const initialBudget = reqBody.budget || 10000;

    // Base structure for teams mapping
    const teams: Record<string, any> = {};
    participants.forEach((p: any) => {
      teams[p.id] = {
        id: p.id,
        name: p.name,
        budget: initialBudget,
        players: [],
        isBot: p.isBot || false
      };
    });

    let finalizedPlayers = reqBody.players || [];

    // Apply specific rules if the selected mode is Football/FIFA
    if (sport.toLowerCase() === 'football' || sport.toLowerCase() === 'fifa') {
      
      // Pull from your specific WC2026_PLAYERS export
      const sourceDataset = finalizedPlayers.length > 0 ? finalizedPlayers : WC2026_PLAYERS;

      // Map through all players to recalculate Tiers and Base Prices
      const processedPlayers = sourceDataset.map((player: any) => {
        const accurateTier = calculateHybridTier(player);
        
        // Base Price Assignment (Converted to Lakhs scale)
        let determinedBasePrice = 20; // Default Tier 5 -> 0.2 Cr
        if (accurateTier === 1) determinedBasePrice = 200;      // Tier 1 -> 2.0 Cr
        if (accurateTier === 2) determinedBasePrice = 150;      // Tier 2 -> 1.5 Cr
        if (accurateTier === 3) determinedBasePrice = 100;      // Tier 3 -> 1.0 Cr
        if (accurateTier === 4) determinedBasePrice = 50;       // Tier 4 -> 0.5 Cr
        if (accurateTier === 5) determinedBasePrice = 20;       // Tier 5 -> 0.2 Cr

        return {
          ...player,
          tier: accurateTier,
          basePrice: determinedBasePrice,
          currentBid: 0,
          status: 'unsold'
        };
      });

      // Sorting & Shuffling Rule: Sequential by tier, randomized within each tier group
      const t1 = shuffleArray(processedPlayers.filter((p: any) => p.tier === 1));
      const t2 = shuffleArray(processedPlayers.filter((p: any) => p.tier === 2));
      const t3 = shuffleArray(processedPlayers.filter((p: any) => p.tier === 3));
      const t4 = shuffleArray(processedPlayers.filter((p: any) => p.tier === 4));
      const t5 = shuffleArray(processedPlayers.filter((p: any) => p.tier === 5));

      finalizedPlayers = [...t1, ...t2, ...t3, ...t4, ...t5];
    }

    const newRoom = {
      id: roomId,
      name,
      sport,
      status: 'waiting',
      budget: initialBudget,
      squadSize: squadSize || 15,
      creatorId,
      participants,
      teams,
      players: finalizedPlayers,
      currentBacklogIndex: 0,
      phase: 'ready',
      timer: 30,
      config: config || { cpuBotsEnabled: false }
    };

    await saveRoom(newRoom);

    return NextResponse.json({ success: true, roomId, room: newRoom });
  } catch (error: any) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// Add this at the bottom of src/app/api/rooms/route.ts

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // TODO: Hook this up to your actual database logic if you have saved history.
    // For now, we return an empty history array to prevent the frontend from crashing.
    const history: any[] = []; 

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Error fetching room history:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}