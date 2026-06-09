/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/db';

const BID_TIMER_MS = 30000; 
const BID_EXTENSION_MS = 15000; 
const MIN_BASE_PRICE = 2000000; // 20 Lakhs is the minimum reserved for empty spots

const toArr = (val: any) => Array.isArray(val) ? val : (typeof val === 'object' && val !== null ? Object.values(val) : []);

const formatCurrency = (val: number | string | null | undefined) => {
  const num = Number(val);
  if (isNaN(num)) return '₹0L';
  if (num >= 10000000) {
    const cr = num / 10000000;
    return `₹${Number.isInteger(cr) ? cr : cr.toFixed(2)}Cr`;
  }
  if (num >= 100000) {
    const lk = num / 100000;
    return `₹${Number.isInteger(lk) ? lk : lk.toFixed(2)}L`;
  }
  return `₹${num.toLocaleString()}`;
};

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

    room.participants = toArr(room.participants).map((p: any) => ({
      ...p,
      budget: p.budget || room.budget || 1000000000,
      spent: p.spent || 0,
      squad: toArr(p.squad)
    }));
    
    room.players = toArr(room.players);
    room.chat = toArr(room.chat);
    room.bidHistory = toArr(room.bidHistory);
    room.passedBy = toArr(room.passedBy);
    room.soldLog = toArr(room.soldLog);
    room.unsoldLog = toArr(room.unsoldLog);

    const now = Date.now();

    switch (action.type) {
      case 'PAUSE': {
        if (room.hostId !== userId) return NextResponse.json({ error: 'Only host can pause' }, { status: 403 });
        const remainingMs = room.endsAt ? Math.max(0, room.endsAt - now) : 30000;
        room.phase = 'paused';
        room.timeLeft = remainingMs; 
        room.endsAt = null;
        room.chat.push({ id: now, user: 'System', msg: '⏸️ Auction paused by host.' });
        room.chat = room.chat.slice(-60);
        await saveRoom(room, { skipPlayers: true });
        break;
      }
      case 'RESUME': {
        if (room.hostId !== userId) return NextResponse.json({ error: 'Only host can resume' }, { status: 403 });
        const resumeMs = (room.timeLeft || 0) + 3000;
        room.phase = 'bidding';
        room.endsAt = now + resumeMs;
        room.timeLeft = 0; 
        room.chat.push({ id: now, user: 'System', msg: '▶️ Auction resumed (+3s)' });
        room.chat = room.chat.slice(-60);
        await saveRoom(room, { skipPlayers: true });
        break;
      }
      case 'END_AUCTION': {
        if (room.hostId !== userId) return NextResponse.json({ error: 'Only host can end' }, { status: 403 });
        room.phase = 'done';
        room.endsAt = null;
        room.chat.push({ id: now, user: 'System', msg: '🛑 Auction ended early by host.' });
        room.chat = room.chat.slice(-60);
        await saveRoom(room, { skipPlayers: true });
        break;
      }

      case 'ADVANCE': {
        if (!room.endsAt || now < (room.endsAt - 2000)) break; 
        let updated = false;

        if (room.phase === 'bidding') {
          const pl = room.players[room.playerIdx];
          if (room.currentBidder) {
            room.phase = 'sold';
            room.endsAt = now + 2500;
            const win = room.participants.find((p: any) => p.id === room.currentBidder);
            if (win) {
              win.squad.push({ ...pl, soldPrice: room.currentBid || 0 });
              win.spent = (win.spent || 0) + (room.currentBid || 0); 
            }
            room.soldLog.push({ player: pl, price: room.currentBid || 0, buyer: room.currentBidder });
            room.chat.push({ id: now, user: 'System', msg: `🔨 SOLD! ${pl?.name || 'Player'} for ${formatCurrency(room.currentBid)}.` });
          } else {
            room.phase = 'unsold';
            room.endsAt = now + 2500;
            room.unsoldLog.push(pl);
            room.chat.push({ id: now, user: 'System', msg: `❌ UNSOLD: ${pl?.name || 'Player'}. No bids.` });
          }
          room.chat = room.chat.slice(-60);
          updated = true;
        } 
        else if (room.phase === 'sold' || room.phase === 'unsold') {
          room.playerIdx++;
          
          if (room.playerIdx >= room.players.length) {
            if (room.unsoldLog.length > 0) {
              room.players = [...room.unsoldLog];
              room.unsoldLog = []; 
              room.playerIdx = 0;
              room.phase = 'bidding';
              room.currentBid = room.players[0]?.base || 5000000;
              room.currentBidder = null;
              room.passedBy = [];
              room.endsAt = now + BID_TIMER_MS;
              room.chat.push({ id: now, user: 'System', msg: `🔄 ROTATION: Unsold players are being presented again!` });
            } else {
              room.phase = 'done';
              room.endsAt = null;
              room.chat.push({ id: now, user: 'System', msg: `🏆 Auction has concluded!` });
            }
          } else {
            room.phase = 'bidding';
            room.currentBid = room.players[room.playerIdx]?.base || 5000000; 
            room.currentBidder = null;
            room.passedBy = [];
            room.endsAt = now + BID_TIMER_MS;
          }
          room.chat = room.chat.slice(-60);
          updated = true;
        }

        if (updated) await saveRoom(room, { skipPlayers: true });
        break;
      }

      case 'START': {
        if (room.hostId !== userId) return NextResponse.json({ error: 'Only the host can start' }, { status: 403 });
        if (room.phase !== 'lobby' && room.phase !== 'scheduled') return NextResponse.json({ error: 'Already started' }, { status: 400 });

        room.phase = 'bidding';
        room.playerIdx = 0;
        room.currentBid = room.players[0]?.base || 5000000;
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
        
        if (team.ownerId && team.ownerId !== userId) return NextResponse.json({ error: 'You do not own this team' }, { status: 403 });
        if (bidder === room.currentBidder) return NextResponse.json({ error: 'You are already the highest bidder' }, { status: 400 });
        if (room.passedBy.includes(bidder)) return NextResponse.json({ error: 'You passed on this player' }, { status: 400 });

        const nextBidVal = (room.currentBid || 0) + amount;
        
        if (team.spent + nextBidVal > team.budget) return NextResponse.json({ error: 'Insufficient budget' }, { status: 400 });

        const spotsLeft = room.squadSize - (team.squad || []).length;
        
        // Strict Squad Complete Check
        if (spotsLeft <= 0) {
            return NextResponse.json({ error: 'Squad is fully complete. You cannot bid on anymore players.' }, { status: 400 });
        }

        if (spotsLeft > 0) {
          const budgetLeft = team.budget - team.spent;
          const reservedForOthers = (spotsLeft - 1) * MIN_BASE_PRICE;
          const maxBidAllowed = budgetLeft - reservedForOthers;
          
          if (nextBidVal > maxBidAllowed) {
             return NextResponse.json({ error: 'Budget Protection Limit Hit.' }, { status: 400 });
          }
        }

        room.currentBid = nextBidVal;
        room.currentBidder = bidder;
        room.endsAt = Math.min((room.endsAt || now) + BID_EXTENSION_MS, now + BID_TIMER_MS);
        
        room.bidHistory.unshift({ id: now, bidder, amount: nextBidVal });
        room.bidHistory = room.bidHistory.slice(0, 30);

        await saveRoom(room, { skipPlayers: true });
        break;
      }

      case 'SKIP': {
        if (room.hostId !== userId) return NextResponse.json({ error: 'Only the host can skip' }, { status: 403 });
        if (room.phase !== 'bidding') return NextResponse.json({ error: 'Can only skip during active bidding' }, { status: 400 });

        const skipped = room.players[room.playerIdx];
        const hadBid = !!room.currentBidder;
        room.phase = 'unsold';
        room.currentBidder = null;
        room.endsAt = now + 1500; 

        room.chat.push({
          id: now, user: 'System',
          msg: hadBid ? `⏭️ Host skipped ${skipped?.name ?? 'the player'} — bid discarded.` : `⏭️ Host skipped ${skipped?.name ?? 'the player'}.`,
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
        
        if (team.ownerId && team.ownerId !== userId) return NextResponse.json({ error: 'You do not own this team' }, { status: 403 });
        if (bidder === room.currentBidder) return NextResponse.json({ error: "You're the highest bidder" }, { status: 400 });

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
            room.chat.push({ id: now + 1, user: 'System', msg: `🔨 SOLD! ${room.players[room.playerIdx]?.name ?? 'Player'} to ${winner?.name ?? 'the bidder'} for ${formatCurrency(room.currentBid)}.` });
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

      default: return NextResponse.json({ error: `Unsupported action type` }, { status: 400 });
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