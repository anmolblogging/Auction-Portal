import { AuctionState, AuctionAction, Participant, Player } from './types';

export function mkState(
  teams: Array<{ id: string; name: string; color: string; photo: string | null; budget: number }>,
  players: Player[]
): AuctionState {
  return {
    phase: 'bidding',
    playerIdx: 0,
    currentBid: players[0].base,
    currentBidder: null,
    timeLeft: 30,
    bidHistory: [],
    chat: [{ id: 1, user: 'System', msg: 'Auction started — good luck!' }],
    participants: teams.map((t) => ({ ...t, spent: 0, squad: [] })),
    soldLog: [],
    unsoldLog: [],
    players,
  };
}

export function auctionReducer(state: AuctionState, action: AuctionAction): AuctionState {
  switch (action.type) {
    case 'TICK': {
      if (state.phase !== 'bidding') return state;
      const timeLeft = state.timeLeft || 0;
      if (timeLeft <= 1) {
        return { ...state, phase: state.currentBidder ? 'sold' : 'unsold', timeLeft: 0 };
      }
      return { ...state, timeLeft: timeLeft - 1 };
    }

    case 'BID': {
      if (state.phase !== 'bidding') return state;
      const { bidder, amount } = action;
      const newBid = state.currentBid + amount;
      const p = state.participants.find((x) => x.id === bidder);
      if (!p || p.spent + newBid > p.budget || bidder === state.currentBidder) return state;
      const newEntry = { id: Date.now(), bidder, amount: newBid };
      return {
        ...state,
        currentBid: newBid,
        currentBidder: bidder,
        timeLeft: Math.min((state.timeLeft || 0) + 15, 30),
        bidHistory: [newEntry, ...state.bidHistory.slice(0, 29)],
      };
    }

    case 'NEXT': {
      const ni = state.playerIdx + 1;
      if (ni >= state.players.length) return { ...state, phase: 'done' };

      let pts: Participant[] = state.participants;
      let sl = state.soldLog;
      let ul = state.unsoldLog;

      if (state.phase === 'sold' && state.currentBidder) {
        const bid = state.currentBid;
        const who = state.currentBidder;
        const sold: Player = { ...state.players[state.playerIdx], soldPrice: bid };
        pts = state.participants.map((p) =>
          p.id === who ? { ...p, spent: p.spent + bid, squad: [...p.squad, sold] } : p
        );
        sl = [...state.soldLog, { player: state.players[state.playerIdx], buyer: who, price: bid }];
      } else {
        ul = [...state.unsoldLog, state.players[state.playerIdx]];
      }

      const nxt = state.players[ni];
      return {
        ...state,
        phase: 'bidding',
        playerIdx: ni,
        currentBid: nxt.base,
        currentBidder: null,
        timeLeft: 30,
        participants: pts,
        soldLog: sl,
        unsoldLog: ul,
      };
    }

    case 'CHAT': {
      const entry = { id: Date.now(), user: action.user || 'You', msg: action.msg };
      return { ...state, chat: [...state.chat, entry].slice(-60) };
    }

    default:
      return state;
  }
}
