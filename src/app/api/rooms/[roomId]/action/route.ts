/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/db';

const BID_TIMER_MS = 60000;
const BID_EXTENSION_MS = 20000;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { action, userId } = body;

    if (!action || !action.type) {
      return NextResponse.json({ error: 'Action type is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const room = await getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    let modified = false;
    const now = Date.now();

    switch (action.type) {
      case 'START': {
        // Only host can start the auction
        if (room.hostId !== userId) {
          return NextResponse.json({ error: 'Only the host can start the auction' }, { status: 403 });
        }
        if (room.phase !== 'lobby' && room.phase !== 'scheduled') {
          return NextResponse.json({ error: 'Auction has already started' }, { status: 400 });
        }

        room.phase = 'bidding';
        room.playerIdx = 0;
        room.currentBid = room.players[0].base;
        room.currentBidder = null;
        room.endsAt = now + BID_TIMER_MS;
        modified = true;
        break;
      }

      case 'BID': {
        const { bidder, amount } = action;

        if (room.phase !== 'bidding') {
          return NextResponse.json({ error: 'Bidding is not active' }, { status: 400 });
        }

        const team = room.participants.find((p: any) => p.id === bidder);
        if (!team) {
          return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Validate that user owns the team they are bidding with
        if (team.ownerId !== userId) {
          return NextResponse.json({ error: 'You do not own this team' }, { status: 403 });
        }

        if (bidder === room.currentBidder) {
          return NextResponse.json({ error: 'You are already the highest bidder' }, { status: 400 });
        }

        const nextBidVal = room.currentBid + amount;
        if (team.spent + nextBidVal > team.budget) {
          return NextResponse.json({ error: 'Insufficient budget' }, { status: 400 });
        }

        room.currentBid = nextBidVal;
        room.currentBidder = bidder;
        room.endsAt = Math.min((room.endsAt || now) + BID_EXTENSION_MS, now + BID_TIMER_MS);

        room.bidHistory.unshift({
          id: now,
          bidder,
          amount: nextBidVal,
        });
        room.bidHistory = room.bidHistory.slice(0, 30);

        // No chat push for bids as requested

        modified = true;
        break;
      }

      case 'CHAT': {
        const { msg, user } = action;
        if (!msg || !msg.trim()) {
          return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
        }

        room.chat.push({
          id: now,
          user: user || 'Guest',
          msg: msg.trim(),
        });
        // Keep only last 60 chats
        room.chat = room.chat.slice(-60);
        modified = true;
        break;
      }

      default:
        return NextResponse.json({ error: `Unsupported action type: ${action.type}` }, { status: 400 });
    }

    if (modified) {
      await saveRoom(room);
    }

    // Return current state, calculating time left
    const timeLeft = room.endsAt ? Math.max(0, Math.ceil((room.endsAt - Date.now()) / 1000)) : 60;

    return NextResponse.json({
      room: {
        ...room,
        timeLeft,
      },
    });
  } catch (error: any) {
    console.error('Error handling action:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
