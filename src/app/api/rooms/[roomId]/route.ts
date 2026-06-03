/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/db';

const BID_TIMER_MS = 30000;
const TRANSITION_DELAY_MS = 1500;

// 🚀 FIREBASE FIX: The Array Sanitizer for the Backend
const toArr = (val: any) => Array.isArray(val) ? val : (typeof val === 'object' && val !== null ? Object.values(val) : []);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await getRoom(roomId);
    
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    // 🚀 Force all arrays to be real arrays so the backend doesn't crash on .length or .find()
    room.participants = toArr(room.participants);
    room.players = toArr(room.players);
    room.chat = toArr(room.chat);
    room.bidHistory = toArr(room.bidHistory);
    room.soldLog = toArr(room.soldLog);
    room.unsoldLog = toArr(room.unsoldLog);
    room.passedBy = toArr(room.passedBy);

    const now = Date.now();
    let updated = false;

    // Added a 2500ms buffer to forgive server/client clock delays
    if (room.endsAt && (now + 2500) >= room.endsAt) {
      if (room.phase === 'bidding') {
        const pl = room.players[room.playerIdx];
        
        if (room.currentBidder) {
          room.phase = 'sold';
          room.endsAt = now + TRANSITION_DELAY_MS;
          
          const win = room.participants.find((p: any) => p.id === room.currentBidder);
          if (win) {
            win.squad = toArr(win.squad);
            win.squad.push({ ...pl, soldPrice: room.currentBid });
            win.spent += room.currentBid;
          }
          
          room.soldLog.push({ player: pl, price: room.currentBid, buyer: room.currentBidder });
          room.chat.push({ id: now, user: 'System', msg: `🔨 SOLD! ${pl.name} for ₹${room.currentBid}L.` });
          updated = true;
        } else {
          room.phase = 'unsold';
          room.endsAt = now + TRANSITION_DELAY_MS;
          
          room.unsoldLog.push(pl);
          room.chat.push({ id: now, user: 'System', msg: `❌ UNSOLD: ${pl.name}. No bids.` });
          updated = true;
        }
        
        room.chat = room.chat.slice(-60);
      } 
      else if (room.phase === 'sold' || room.phase === 'unsold') {
        room.playerIdx++;
        
        if (room.playerIdx >= room.players.length) {
          room.phase = 'done';
          room.endsAt = null;
          
          room.chat.push({ id: now, user: 'System', msg: `🏆 Auction has concluded!` });
          room.chat = room.chat.slice(-60);
        } else {
          room.phase = 'bidding';
          room.currentBid = room.players[room.playerIdx].base;
          room.currentBidder = null;
          room.passedBy = [];
          room.endsAt = now + BID_TIMER_MS;
        }
        updated = true;
      }
      else if (room.phase === 'scheduled' && room.scheduledAt) {
        if (now >= room.scheduledAt) {
          room.phase = 'bidding';
          room.playerIdx = 0;
          room.currentBid = room.players[0]?.base || 10;
          room.currentBidder = null;
          room.passedBy = [];
          room.endsAt = now + BID_TIMER_MS;
          updated = true;
        }
      }
    }

    if (updated) await saveRoom(room, { skipPlayers: true });

    const timeLeft = room.endsAt ? Math.max(0, Math.ceil((room.endsAt - Date.now()) / 1000)) : 30;
    return NextResponse.json({ room: { ...room, timeLeft } });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

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

    const openSlot = room.participants.find((p: any) => p.ownerId === null);
    if (!openSlot) {
      return NextResponse.json({ error: 'Room is full! No open slots left.' }, { status: 400 });
    }

    openSlot.ownerId = userId;
    openSlot.name = teamName || 'Guest Team';
    openSlot.photo = teamPhoto || null;

    await saveRoom(room, { skipPlayers: true });
    return NextResponse.json({ room, teamId: openSlot.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}