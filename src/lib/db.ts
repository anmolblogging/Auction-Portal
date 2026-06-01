import fs from 'fs/promises';
import path from 'path';
import { Player, Participant } from './types';

export interface ServerRoom {
  id: string;
  name: string;
  sport: string;
  tournament: string;
  budget: number;
  squadSize: number;
  enableBots: boolean;
  phase: 'scheduled' | 'lobby' | 'bidding' | 'sold' | 'unsold' | 'done';
  playerIdx: number;
  currentBid: number;
  currentBidder: string | null;
  endsAt: number | null; // timestamp in ms
  bidHistory: any[];
  chat: any[];
  participants: Array<
    Participant & {
      ownerId: string | null; // User ID controlling this team, or null if CPU
    }
  >;
  soldLog: any[];
  unsoldLog: any[];
  players: Player[];
  hostId: string;
  scheduledAt: number | null; // timestamp in ms — when to auto-launch
  createdAt: number;
  updatedAt: number;
}

const DB_FILE = path.join(process.cwd(), 'src', 'lib', 'db.json');

// Memory queue to prevent race conditions
let writeQueue = Promise.resolve();

async function ensureDbFile() {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify({}, null, 2), 'utf-8');
  }
}

export async function readDb(): Promise<Record<string, ServerRoom>> {
  await ensureDbFile();
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data || '{}');
  } catch (err) {
    console.error('Error reading DB:', err);
    return {};
  }
}

export async function writeDb(data: Record<string, ServerRoom>): Promise<void> {
  await ensureDbFile();
  // Chain the write operation to execute sequentially
  writeQueue = writeQueue.then(async () => {
    try {
      await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing DB:', err);
    }
  });
  return writeQueue;
}

export async function getRoom(roomId: string): Promise<ServerRoom | null> {
  const db = await readDb();
  return db[roomId.toUpperCase()] || null;
}

export async function saveRoom(room: ServerRoom): Promise<void> {
  const db = await readDb();
  db[room.id.toUpperCase()] = {
    ...room,
    updatedAt: Date.now(),
  };
  await writeDb(db);
}

export async function cleanInactiveRooms(): Promise<void> {
  const db = await readDb();
  const now = Date.now();
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  let changed = false;

  for (const id of Object.keys(db)) {
    const room = db[id];
    if (room && room.updatedAt && now - room.updatedAt > INACTIVITY_TIMEOUT) {
      delete db[id];
      changed = true;
    }
  }

  if (changed) {
    await writeDb(db);
  }
}

