import { NextResponse } from 'next/server';
import { readDb, saveRoom, ServerRoom } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      roomId: clientRoomId,
      name,
      sport,
      tournament,
      participants,
      budget,
      squadSize,
      enableBots,
      teams,
      players,
      hostId,
      scheduledAt,
    } = body;

    if (!hostId) {
      return NextResponse.json({ error: 'hostId is required' }, { status: 400 });
    }

    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return NextResponse.json({ error: 'teams are required' }, { status: 400 });
    }

    if (!players || !Array.isArray(players) || players.length === 0) {
      return NextResponse.json({ error: 'players are required' }, { status: 400 });
    }

    const db = await readDb();

    // Generate unique room ID
    let roomId = '';
    if (clientRoomId && !db[clientRoomId]) {
      roomId = clientRoomId;
    } else {
      let attempts = 0;
      while (attempts < 20) {
        const code = Math.floor(1000 + Math.random() * 9000);
        const testId = `AUC-${code}`;
        if (!db[testId]) {
          roomId = testId;
          break;
        }
        attempts++;
      }

      if (!roomId) {
        roomId = `AUC-${Date.now().toString().slice(-4)}`;
      }
    }

    const initializedParticipants = teams.slice(0, participants).map((t, idx) => {
      // The creator (host) automatically gets assigned the 'you' team (or first team)
      const isHostTeam = t.id === 'you' || idx === 0;
      return {
        ...t,
        budget: budget || 1000,
        spent: 0,
        squad: [],
        ownerId: isHostTeam ? hostId : null,
      };
    });

    const isScheduled = scheduledAt && scheduledAt > Date.now();
    const scheduledDate = isScheduled ? new Date(scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null;

    const newRoom: ServerRoom = {
      id: roomId,
      name: name || 'Sports Auction',
      sport: sport || 'Custom',
      tournament: tournament || 'Custom',
      budget: budget || 1000,
      squadSize: squadSize || 11,
      enableBots: enableBots ?? true,
      phase: isScheduled ? 'scheduled' : 'lobby',
      playerIdx: 0,
      currentBid: players[0]?.base || 50,
      currentBidder: null,
      endsAt: null,
      bidHistory: [],
      chat: [
        {
          id: Date.now(),
          user: 'System',
          msg: isScheduled
            ? `🕐 Auction scheduled for ${scheduledDate}. Room ${roomId} created.`
            : `Room ${roomId} created by host. Welcome!`,
        },
      ],
      participants: initializedParticipants,
      soldLog: [],
      unsoldLog: [],
      players: players,
      hostId,
      scheduledAt: isScheduled ? scheduledAt : null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveRoom(newRoom);

    return NextResponse.json({ room: newRoom });
  } catch (error: any) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
