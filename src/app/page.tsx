'use client';
import { useState, useEffect } from 'react';
import Landing from '@/components/Landing';
import CreateRoom from '@/components/CreateRoom';
import AuctionRoom from '@/components/AuctionRoom';
import {
  ADMIN_CREDENTIALS,
  normalizeUserId,
  STORAGE_KEYS,
} from '@/lib/auth';
import type { AuthSession, ManagedUser } from '@/lib/auth';

type View = 'landing' | 'create' | 'auction';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [guestUserId, setGuestUserId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const hydrateFromStorage = () => {
      let nextGuestUserId = localStorage.getItem(STORAGE_KEYS.guestUserId);
      if (!nextGuestUserId) {
        nextGuestUserId = `usr_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem(STORAGE_KEYS.guestUserId, nextGuestUserId);
      }

      let nextManagedUsers: ManagedUser[] = [];
      const storedUsers = localStorage.getItem(STORAGE_KEYS.managedUsers);
      if (storedUsers) {
        try {
          const parsedUsers = JSON.parse(storedUsers) as ManagedUser[];
          nextManagedUsers = Array.isArray(parsedUsers) ? parsedUsers : [];
        } catch {
          localStorage.removeItem(STORAGE_KEYS.managedUsers);
        }
      }

      let nextAuthSession: AuthSession | null = null;
      const storedSession = localStorage.getItem(STORAGE_KEYS.authSession);
      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession) as AuthSession;
          const isAdmin =
            parsedSession.userId === ADMIN_CREDENTIALS.userId &&
            parsedSession.isAdmin;

          if (isAdmin) {
            nextAuthSession = parsedSession;
          } else {
            const matchingUser = nextManagedUsers.find(
              (user) =>
                normalizeUserId(user.userId) === normalizeUserId(parsedSession.userId)
            );

            if (matchingUser?.active) {
              nextAuthSession = {
                userId: matchingUser.userId,
                isAdmin: false,
                loggedInAt: parsedSession.loggedInAt,
              };
            } else {
              localStorage.removeItem(STORAGE_KEYS.authSession);
            }
          }
        } catch {
          localStorage.removeItem(STORAGE_KEYS.authSession);
        }
      }

      const savedRoomId = sessionStorage.getItem('sar_room_id');
      const savedTeamId = sessionStorage.getItem('sar_team_id');
      const savedName = sessionStorage.getItem('sar_user_name');

      setGuestUserId(nextGuestUserId);
      setManagedUsers(nextManagedUsers);
      setAuthSession(nextAuthSession);

      if (savedRoomId && savedTeamId) {
        setRoomId(savedRoomId);
        setTeamId(savedTeamId);
        if (savedName) {
          setUserName(savedName);
        }
        setView('auction');
      }
    };

    const timeoutId = window.setTimeout(hydrateFromStorage, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const activeUserId = authSession?.userId || guestUserId;

  const handleJoinRoom = (rid: string, tid: string, name: string) => {
    setRoomId(rid);
    setTeamId(tid);
    setUserName(name);
    sessionStorage.setItem('sar_room_id', rid);
    sessionStorage.setItem('sar_team_id', tid);
    sessionStorage.setItem('sar_user_name', name);
    setView('auction');
  };

  const handleLeaveRoom = () => {
    sessionStorage.removeItem('sar_room_id');
    sessionStorage.removeItem('sar_team_id');
    setRoomId('');
    setTeamId('');
    setView('landing');
  };

  const handleLogin = (loginUserId: string, password: string) => {
    const normalizedId = normalizeUserId(loginUserId);
    const trimmedPassword = password.trim();

    if (
      normalizedId === ADMIN_CREDENTIALS.userId &&
      trimmedPassword === ADMIN_CREDENTIALS.password
    ) {
      const session: AuthSession = {
        userId: ADMIN_CREDENTIALS.userId,
        isAdmin: true,
        loggedInAt: Date.now(),
      };
      setAuthSession(session);
      localStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify(session));
      return session;
    }

    const user = managedUsers.find(
      (entry) => normalizeUserId(entry.userId) === normalizedId
    );

    if (!user || user.password !== trimmedPassword) {
      throw new Error('Invalid user ID or password');
    }
    if (!user.active) {
      throw new Error('This user ID is currently inactive');
    }

    const session: AuthSession = {
      userId: user.userId,
      isAdmin: false,
      loggedInAt: Date.now(),
    };
    setAuthSession(session);
    localStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify(session));
    return session;
  };

  const handleLogout = () => {
    setAuthSession(null);
    localStorage.removeItem(STORAGE_KEYS.authSession);
    if (view === 'create') {
      setView('landing');
    }
  };

  const handleCreateUser = (newUserId: string, password: string) => {
    const normalizedId = normalizeUserId(newUserId);
    const trimmedPassword = password.trim();

    if (!authSession?.isAdmin) {
      throw new Error('Only the admin user can manage accounts');
    }
    if (!normalizedId) {
      throw new Error('User ID is required');
    }
    if (normalizedId === ADMIN_CREDENTIALS.userId) {
      throw new Error('The admin user ID is reserved');
    }
    if (trimmedPassword.length < 4) {
      throw new Error('Password must be at least 4 characters');
    }
    if (
      managedUsers.some(
        (user) => normalizeUserId(user.userId) === normalizedId
      )
    ) {
      throw new Error('This user ID already exists');
    }

    const updatedUsers = [
      ...managedUsers,
      {
        userId: normalizedId,
        password: trimmedPassword,
        active: true,
        createdAt: Date.now(),
      },
    ];
    setManagedUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEYS.managedUsers, JSON.stringify(updatedUsers));
  };

  const handleToggleUser = (managedUserId: string) => {
    if (!authSession?.isAdmin) {
      throw new Error('Only the admin user can manage accounts');
    }

    const updatedUsers = managedUsers.map((user) =>
      normalizeUserId(user.userId) === normalizeUserId(managedUserId)
        ? { ...user, active: !user.active }
        : user
    );

    setManagedUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEYS.managedUsers, JSON.stringify(updatedUsers));

    const currentUser = updatedUsers.find(
      (user) => normalizeUserId(user.userId) === normalizeUserId(authSession.userId)
    );
    if (currentUser && !currentUser.active) {
      handleLogout();
    }
  };

  if (view === 'landing') {
    return (
      <Landing
        userId={activeUserId}
        authSession={authSession}
        managedUsers={managedUsers}
        onStart={() => setView('create')}
        onJoin={handleJoinRoom}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onCreateUser={handleCreateUser}
        onToggleUser={handleToggleUser}
      />
    );
  }
  if (view === 'create') {
    return (
      <CreateRoom
        userId={activeUserId}
        onLaunch={(rid, tid, name) => handleJoinRoom(rid, tid, name)}
        onBack={() => setView('landing')}
      />
    );
  }
  if (view === 'auction' && roomId) {
    return (
      <AuctionRoom
        roomId={roomId}
        userId={activeUserId}
        teamId={teamId}
        userName={userName}
        onLeave={handleLeaveRoom}
      />
    );
  }
  return null;
}
