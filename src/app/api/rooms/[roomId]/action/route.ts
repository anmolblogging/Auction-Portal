/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getRoom, saveRoom, getDeterministicUuid } from '@/lib/db';
import { supabase } from '@/lib/supabase';

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

    const now = Date.now();
    const dbRoomId = getDeterministicUuid(roomId);

    switch (action.type) {
      // ─────────────────────────────────────────────────────────────────
      // START: Phase transition — full saveRoom is appropriate here
      // ─────────────────────────────────────────────────────────────────
      case 'START': {
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

        await saveRoom(room);
        break;
      }

      // ─────────────────────────────────────────────────────────────────
      // BID: Use targeted DB write — tries atomic RPC first, then helper
      // ─────────────────────────────────────────────────────────────────
      case 'BID': {
        const { bidder, amount } = action;

        if (room.phase !== 'bidding') {
          return NextResponse.json({ error: 'Bidding is not active' }, { status: 400 });
        }

        // Validate bidder exists as a participant
        const team = room.participants.find((p: any) => p.id === bidder);
        if (!team) {
          return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Validate ownership
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

        // Calculate new timer (extend but cap at BID_TIMER_MS from now)
        const newEndsAt = Math.min((room.endsAt || now) + BID_EXTENSION_MS, now + BID_TIMER_MS);

        // Resolve DB UUIDs needed for the targeted writes
        const dbTeamId = getDeterministicUuid(`${roomId}-${bidder}`);
        const activePlayer = room.players[room.playerIdx];
        const dbPlayerId = getDeterministicUuid(`${roomId}-player-${activePlayer.id}`);

        // Try the atomic RPC first (requires the function to exist in Supabase)
        let rpcSuccess = false;
        try {
          const { data: rpcResult, error: rpcError } = await (supabase as any).rpc('place_auction_bid', {
            p_room_id: dbRoomId,
            p_team_id: dbTeamId,
            p_player_id: dbPlayerId,
            p_amount: nextBidVal,
            p_ends_at: newEndsAt,
          });

          if (!rpcError && rpcResult?.ok === true) {
            rpcSuccess = true;
          } else if (!rpcError && rpcResult?.ok === false) {
            // DB-level validation rejected the bid (race condition caught!)
            return NextResponse.json({ error: rpcResult.error || 'Bid rejected by server' }, { status: 409 });
          }
          // If rpcError (function not deployed yet), fall through to manual writes below
        } catch (_rpcEx) {
          // RPC not available — fall through
        }

        if (!rpcSuccess) {
          // Fallback: manual targeted writes (still better than saveRoom blob)
          const { error: bidInsertErr } = await (supabase as any).from('bids').insert({
            room_id: dbRoomId,
            team_id: dbTeamId,
            player_id: dbPlayerId,
            amount: nextBidVal,
          });
          if (bidInsertErr) {
            console.error('Bid insert error:', bidInsertErr);
            return NextResponse.json({ error: 'Failed to record bid' }, { status: 500 });
          }

          const { error: roomUpdateErr } = await (supabase as any)
            .from('rooms')
            .update({
              current_bid: nextBidVal,
              current_bidder: dbTeamId,
              ends_at: newEndsAt,
              updated_at: new Date().toISOString(),
            })
            .eq('id', dbRoomId);
          if (roomUpdateErr) {
            console.error('Room update error:', roomUpdateErr);
            return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
          }
        }

        // Fetch fresh state to return accurate data
        const freshRoom = await getRoom(roomId);
        if (!freshRoom) {
          return NextResponse.json({ error: 'Room not found after bid' }, { status: 404 });
        }
        const timeLeft = freshRoom.endsAt
          ? Math.max(0, Math.ceil((freshRoom.endsAt - Date.now()) / 1000))
          : 60;
        return NextResponse.json({ room: { ...freshRoom, timeLeft } });
      }

      // ─────────────────────────────────────────────────────────────────
      // CHAT: Direct insert — no blob saveRoom needed
      // ─────────────────────────────────────────────────────────────────
      case 'CHAT': {
        const { msg, user } = action;
        if (!msg || !msg.trim()) {
          return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
        }

        // Resolve sender's DB UUID if they exist (best-effort)
        let dbSenderId: string | null = null;
        try {
          const senderUuid = getDeterministicUuid(userId);
          const { data: existingUser } = await (supabase as any)
            .from('users')
            .select('id')
            .eq('id', senderUuid)
            .single();
          if (existingUser) dbSenderId = senderUuid;
        } catch (_) {
          // Sender lookup failed — send as anonymous
        }

        const { error: chatErr } = await (supabase as any).from('chat_messages').insert({
          room_id: dbRoomId,
          user_id: dbSenderId,
          message: msg.trim(),
        });

        if (chatErr) {
          console.error('Chat insert error:', chatErr);
          return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
        }

        // Fetch fresh state with the new chat message included
        const freshRoom = await getRoom(roomId);
        if (!freshRoom) {
          return NextResponse.json({ error: 'Room not found after chat' }, { status: 404 });
        }
        const timeLeft = freshRoom.endsAt
          ? Math.max(0, Math.ceil((freshRoom.endsAt - Date.now()) / 1000))
          : 60;
        return NextResponse.json({ room: { ...freshRoom, timeLeft } });
      }

      default:
        return NextResponse.json({ error: `Unsupported action type: ${action.type}` }, { status: 400 });
    }

    // For START action (falls through from switch without early return)
    const freshRoom = await getRoom(roomId);
    if (!freshRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    const timeLeft = freshRoom.endsAt
      ? Math.max(0, Math.ceil((freshRoom.endsAt - Date.now()) / 1000))
      : 60;

    return NextResponse.json({ room: { ...freshRoom, timeLeft } });
  } catch (error: any) {
    console.error('Error handling action:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
