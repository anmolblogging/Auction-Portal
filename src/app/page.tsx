'use client';
import { useState, useEffect } from 'react';
import Landing from '@/components/Landing';
import CreateRoom from '@/components/CreateRoom';
import AuctionRoom from '@/components/AuctionRoom';

type View = 'landing' | 'create' | 'auction';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [userId, setUserId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  // Generate or retrieve persistent userId on mount
  useEffect(() => {
    let id = localStorage.getItem('sar_user_id');
    if (!id) {
      id = `usr_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('sar_user_id', id);
    }
    setUserId(id);

    // Support auto-rejoin on refresh
    const savedRoomId = sessionStorage.getItem('sar_room_id');
    const savedTeamId = sessionStorage.getItem('sar_team_id');
    const savedName = sessionStorage.getItem('sar_user_name');
    if (savedRoomId && savedTeamId) {
      setRoomId(savedRoomId);
      setTeamId(savedTeamId);
      if (savedName) setUserName(savedName);
      setView('auction');
    }
  }, []);

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

  if (view === 'landing') {
    return (
      <Landing
        userId={userId}
        onStart={() => setView('create')}
        onJoin={handleJoinRoom}
      />
    );
  }
  if (view === 'create') {
    return (
      <CreateRoom
        userId={userId}
        onLaunch={(rid, tid, name) => handleJoinRoom(rid, tid, name)}
        onBack={() => setView('landing')}
      />
    );
  }
  if (view === 'auction' && roomId) {
    return (
      <AuctionRoom
        roomId={roomId}
        userId={userId}
        teamId={teamId}
        userName={userName}
        onLeave={handleLeaveRoom}
      />
    );
  }
  return null;
}
