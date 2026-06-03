/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/db';

const BID_TIMER_MS = 30000; 
const BID_EXTENSION_MS = 15000; 

// 🚀 FIREBASE FIX: The Array Sanitizer
const toArr = (val: any) => Array.isArray(val) ? val : (typeof val === 'object' && val !== null ? Object.values(val) : []);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { action, userId } = body;

    if (!action || !action.type) return NextResponse.json({ error: 'Action type is required' }, { status: 400 });
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const room = await getRoom(roomId);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    // Sanitize arrays before doing ANY actions
    room.participants = toArr(room.participants);
    room.players = toArr(room.players);
    room.chat = toArr(room.chat);
    room.bidHistory = toArr(room.bidHistory);
    room.passedBy = toArr(room.passedBy);

    const now = Date.now();

    switch (action.type) {
      case 'START': {
        if (room.hostId !== userId) return NextResponse.json({ error: 'Only the host can start the auction' }, { status: 403 });
        if (room.phase !== 'lobby' && room.phase !== 'scheduled') return NextResponse.json({ error: 'Auction has already started' }, { status: 400 });

        room.phase = 'bidding';
        room.playerIdx = 0;
        room.currentBid = room.players[0].base;
        room.currentBidder = null;
        room.passedBy = [];
        room.endsAt = now + BID_TIMER_MS;

        await saveRoom(room);
        break;
      }

      case 'BID': {
        const { bidder, amount } = action;
        if (room.phase !== 'bidding') return NextResponse.json({ error: 'Bidding is not active' }, { status: 400 });

        const team = room.participants.find((p: any) => p.id === bidder);
        if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        if (team.ownerId !== userId && !room.enableBots) return NextResponse.json({ error: 'You do not own this team' }, { status: 403 });
        if (bidder === room.currentBidder) return NextResponse.json({ error: 'You are already the highest bidder' }, { status: 400 });
        if (room.passedBy.includes(bidder)) return NextResponse.json({ error: 'You passed on this player and can no longer bid' }, { status: 400 });

        const nextBidVal = room.currentBid + amount;
        if (team.spent + nextBidVal > team.budget) return NextResponse.json({ error: 'Insufficient budget' }, { status: 400 });

        room.currentBid = nextBidVal;
        room.currentBidder = bidder;
        room.endsAt = Math.min((room.endsAt || now) + BID_EXTENSION_MS, now + BID_TIMER_MS);
        
        room.bidHistory.unshift({ id: now, bidder, amount: nextBidVal });
        room.bidHistory = room.bidHistory.slice(0, 30);

        await saveRoom(room, { skipPlayers: true });
        break;
      }

      case 'SKIP': {
        if (room.hostId !== userId) return NextResponse.json({ error: 'Only the host can skip a player' }, { status: 403 });
        if (room.phase !== 'bidding') return NextResponse.json({ error: 'Can only skip during active bidding' }, { status: 400 });

        const skipped = room.players[room.playerIdx];
        const hadBid = !!room.currentBidder;
        room.phase = 'unsold';
        room.currentBidder = null;
        room.endsAt = now + 1500; 

        room.chat.push({
          id: now, user: 'System',
          msg: hadBid ? `⏭️ Host skipped ${skipped?.name ?? 'the player'} — standing bid discarded.` : `⏭️ Host skipped ${skipped?.name ?? 'the player'} — no bids.`,
        });
        room.chat = room.chat.slice(-60);

        await saveRoom(room, { skipPlayers: true });
        break;
      }

      case 'PASS': {
        const { bidder } = action;
        if (room.phase !== 'bidding') return NextResponse.json({ error: 'Bidding is not active' }, { status: 400 });

        const team = room.participants.find((p: any) => p.id === bidder);
        if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        if (team.ownerId !== userId) return NextResponse.json({ error: 'You do not own this team' }, { status: 403 });
        if (bidder === room.currentBidder) return NextResponse.json({ error: "You're the highest bidder — you can't pass" }, { status: 400 });

        if (!room.passedBy.includes(bidder)) {
          room.passedBy.push(bidder);
          room.chat.push({ id: now, user: 'System', msg: `🙅 ${team.name} passed on ${room.players[room.playerIdx]?.name ?? 'this player'}.` });

          const passedBy = room.passedBy;
          const others = room.participants.filter((p: any) => p.id !== room.currentBidder);
          const allOthersPassed = !!room.currentBidder && others.length > 0 && others.every((p: any) => passedBy.includes(p.id));

          if (allOthersPassed) {
            const winner = room.participants.find((p: any) => p.id === room.currentBidder);
            room.phase = 'sold';
            room.endsAt = now + 1500;
            room.chat.push({ id: now + 1, user: 'System', msg: `🔨 SOLD! ${room.players[room.playerIdx]?.name ?? 'Player'} to ${winner?.name ?? 'the bidder'} for ₹${room.currentBid}L — everyone else passed.` });
          }

          room.chat = room.chat.slice(-60);
          await saveRoom(room, { skipPlayers: true });
        }
        break;
      }

      case 'CHAT': {
        const { msg, user } = action;
        if (!msg || !msg.trim()) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });

        room.chat.push({ id: now, user: user || 'Guest', msg: msg.trim() });
        room.chat = room.chat.slice(-60);
        
        await saveRoom(room, { skipPlayers: true });
        break;
      }

      default: return NextResponse.json({ error: `Unsupported action type: ${action.type}` }, { status: 400 });
    }

    const freshRoom = await getRoom(roomId);
    if (!freshRoom) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    const timeLeft = freshRoom.endsAt ? Math.max(0, Math.ceil((freshRoom.endsAt - Date.now()) / 1000)) : 30;
    return NextResponse.json({ room: { ...freshRoom, timeLeft } });

  } catch (error: any) {
    console.error('Error handling action:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}