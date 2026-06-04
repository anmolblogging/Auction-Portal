/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const toArr = (val: any) => Array.isArray(val) ? val : (typeof val === 'object' && val !== null ? Object.values(val) : []);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const _url = new URL(req.url); 
    const { roomId } = await params;
    const room = await getRoom(roomId);
    
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    room.participants = toArr(room.participants).map((p: any) => ({
      ...p,
      budget: p.budget || room.budget || 10000,
      spent: p.spent || 0,
      squad: toArr(p.squad)
    }));

    room.players = toArr(room.players);
    room.chat = toArr(room.chat);
    room.bidHistory = toArr(room.bidHistory);
    room.soldLog = toArr(room.soldLog);
    room.unsoldLog = toArr(room.unsoldLog);
    room.passedBy = toArr(room.passedBy);

    const timeLeft = room.endsAt ? Math.max(0, Math.ceil((room.endsAt - Date.now()) / 1000)) : 30;
    return NextResponse.json({ room: { ...room, timeLeft } });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// 🚀 RESTORED: This is the function that allows players to join! 
export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { userId, teamName, teamPhoto } = body;

    const room = await getRoom(roomId);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    
    room.participants = toArr(room.participants);
    const openSlot = room.participants.find((p: any) => !p.ownerId);
    
    if (!openSlot) return NextResponse.json({ error: 'Room is full! No open slots left.' }, { status: 400 });

    openSlot.ownerId = userId;
    openSlot.name = teamName || 'Guest Team';
    openSlot.photo = teamPhoto || null;

    await saveRoom(room, { skipPlayers: true });
    return NextResponse.json({ room, teamId: openSlot.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}