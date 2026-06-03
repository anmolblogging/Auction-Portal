import { NextResponse } from 'next/server';
import { readDb, saveRoom } from '@/lib/db';
import { ServerRoom } from '@/lib/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const db = await readDb();
    
    const rooms = Object.values(db).map((room: ServerRoom) => {
      if (!room.participants || typeof room.participants === 'number') room.participants = [];
      if (!room.players) room.players = [];
      if (!room.chat) room.chat = [];
      if (!room.bidHistory) room.bidHistory = [];
      if (!room.soldLog) room.soldLog = [];
      if (!room.unsoldLog) room.unsoldLog = [];
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
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let room = body.room || body.roomData || body.data || body;
    if (Array.isArray(room)) room = room[0];

    if (!room.id) room.id = room.roomId || room.roomCode || body.roomId || body.id;
    if (!room.id) room.id = `AUC-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!room.phase) room.phase = room.scheduledAt ? 'scheduled' : 'lobby';

    if (room.teams && Array.isArray(room.teams)) {
      room.participants = room.teams;
      delete room.teams;
    }

    if (!room.participants || typeof room.participants === 'number') room.participants = [];
    
    // 🚀 THE FIX: Explicitly grant the host ownership of their team!
    if (room.participants.length > 0 && room.hostId) {
      // Find the host's team (usually ID 'you') and stamp it with their userId
      const hostTeam = room.participants.find((p: any) => p.id === 'you') || room.participants[0];
      if (hostTeam) {
        hostTeam.ownerId = room.hostId;
      }
    }

    if (!room.players) room.players = [];
    if (!room.chat) room.chat = [];
    if (!room.bidHistory) room.bidHistory = [];
    if (!room.soldLog) room.soldLog = [];
    if (!room.unsoldLog) room.unsoldLog = [];
    if (!room.passedBy) room.passedBy = [];
    
    await saveRoom(room);
    return NextResponse.json({ room });
  } catch (error: any) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}