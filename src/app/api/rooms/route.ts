import { NextResponse } from 'next/server';
import { readDb, saveRoom } from '@/lib/db';
import { ServerRoom } from '@/lib/types';

const toArr = (val: any) => Array.isArray(val) ? val : (typeof val === 'object' && val !== null ? Object.values(val) : []);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const db = await readDb();
    
    const rooms = Object.values(db).map((room: ServerRoom) => {
      room.participants = toArr(room.participants);
      room.players = toArr(room.players);
      room.chat = toArr(room.chat);
      room.bidHistory = toArr(room.bidHistory);
      room.soldLog = toArr(room.soldLog);
      room.unsoldLog = toArr(room.unsoldLog);
      if (!room.phase) room.phase = room.scheduledAt ? 'scheduled' : 'lobby';
      return room;
    });

    let history: any[] = [];
    if (userId) {
      history = rooms
        .filter((r) => r.hostId === userId || r.participants.some((p: any) => p.ownerId === userId))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 15)
        .map((r) => ({
          id: r.id, name: r.name, sport: r.sport, phase: r.phase, updatedAt: r.updatedAt || Date.now()
        }));
    }
    
    return NextResponse.json({ rooms, history });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let room = body.room || body.roomData || body.data || body;
    if (Array.isArray(room)) room = room[0];

    if (!room.id) room.id = room.roomId || room.roomCode || body.roomId || body.id || `AUC-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!room.phase) room.phase = room.scheduledAt ? 'scheduled' : 'lobby';

    if (room.teams && Array.isArray(room.teams)) {
      room.participants = room.teams;
      delete room.teams;
    }

    // 🚀 THE BANKER FIX: Ensure every team has a budget, spent tracker, and squad array!
    room.participants = toArr(room.participants).map((p: any) => ({
      ...p,
      budget: p.budget || room.budget || 10000,
      spent: p.spent || 0,
      squad: p.squad || []
    }));

    if (room.participants.length > 0 && room.hostId) {
      let hostTeam = room.participants.find((p: any) => p.id === 'you');
      if (!hostTeam) {
        hostTeam = room.participants[0];
        hostTeam.id = 'you'; 
      }
      hostTeam.ownerId = room.hostId;
    }

    room.players = toArr(room.players);
    room.chat = toArr(room.chat);
    room.bidHistory = toArr(room.bidHistory);
    room.soldLog = toArr(room.soldLog);
    room.unsoldLog = toArr(room.unsoldLog);
    room.passedBy = toArr(room.passedBy);
    
    await saveRoom(room);
    return NextResponse.json({ room });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}