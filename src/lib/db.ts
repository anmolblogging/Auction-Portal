/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, get, set, child } from "firebase/database";
import { database } from "./firebase";
import { ServerRoom } from "./types";
export type { ServerRoom } from "./types";

export function getDeterministicUuid(str: string) { return str; }
export function getOrderedPlayerUuid(roomId: string, idx: number) { return `${roomId}-${idx}`; }
export async function ensureUserExists() { return 'firebase-user'; }
export async function cleanInactiveRooms() {}

export async function getRoom(roomId: string): Promise<ServerRoom | null> {
  const snapshot = await get(child(ref(database), `rooms/${roomId.toUpperCase()}`));
  return snapshot.exists() ? snapshot.val() as ServerRoom : null;
}

export async function saveRoom(room: ServerRoom, opts: any = {}): Promise<void> {
  room.updatedAt = Date.now();
  await set(ref(database, `rooms/${room.id.toUpperCase()}`), room);
}

export async function readDb(): Promise<Record<string, ServerRoom>> {
  const snapshot = await get(ref(database, 'rooms'));
  return snapshot.exists() ? snapshot.val() : {};
}