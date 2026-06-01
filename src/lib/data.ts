import { Player, Team } from './types';

export const DEFAULT_PLAYERS: Player[] = [
  { id: 1,  name: 'Virat Kohli',     country: 'India',        role: 'Batter',      tier: 'Elite',    base: 200, img: 'VK',  nat: '🇮🇳' },
  { id: 2,  name: 'Jasprit Bumrah',  country: 'India',        role: 'Bowler',      tier: 'Elite',    base: 200, img: 'JB',  nat: '🇮🇳' },
  { id: 3,  name: 'MS Dhoni',        country: 'India',        role: 'WK-Batter',   tier: 'Elite',    base: 150, img: 'MSD', nat: '🇮🇳' },
  { id: 4,  name: 'Rohit Sharma',    country: 'India',        role: 'Batter',      tier: 'Elite',    base: 180, img: 'RS',  nat: '🇮🇳' },
  { id: 5,  name: 'Pat Cummins',     country: 'Australia',    role: 'Bowler',      tier: 'Platinum', base: 140, img: 'PC',  nat: '🇦🇺' },
  { id: 6,  name: 'Rashid Khan',     country: 'Afghanistan',  role: 'Bowler',      tier: 'Platinum', base: 120, img: 'RK',  nat: '🇦🇫' },
  { id: 7,  name: 'Andre Russell',   country: 'West Indies',  role: 'All-rounder', tier: 'Platinum', base: 130, img: 'AR',  nat: '🇼🇮' },
  { id: 8,  name: 'KL Rahul',        country: 'India',        role: 'WK-Batter',   tier: 'Platinum', base: 110, img: 'KL',  nat: '🇮🇳' },
  { id: 9,  name: 'Ravindra Jadeja', country: 'India',        role: 'All-rounder', tier: 'Platinum', base: 100, img: 'RJ',  nat: '🇮🇳' },
  { id: 10, name: 'Jos Buttler',     country: 'England',      role: 'WK-Batter',   tier: 'Platinum', base: 120, img: 'JBu', nat: '🇬🇧' },
  { id: 11, name: 'Hardik Pandya',   country: 'India',        role: 'All-rounder', tier: 'Gold',     base: 90,  img: 'HP',  nat: '🇮🇳' },
  { id: 12, name: 'Sunil Narine',    country: 'West Indies',  role: 'All-rounder', tier: 'Gold',     base: 80,  img: 'SN',  nat: '🇼🇮' },
  { id: 13, name: 'Mitchell Starc',  country: 'Australia',    role: 'Bowler',      tier: 'Gold',     base: 75,  img: 'MS',  nat: '🇦🇺' },
  { id: 14, name: 'Babar Azam',      country: 'Pakistan',     role: 'Batter',      tier: 'Gold',     base: 85,  img: 'BA',  nat: '🇵🇰' },
  { id: 15, name: 'David Warner',    country: 'Australia',    role: 'Batter',      tier: 'Gold',     base: 80,  img: 'DW',  nat: '🇦🇺' },
  { id: 16, name: 'Rishabh Pant',    country: 'India',        role: 'WK-Batter',   tier: 'Gold',     base: 70,  img: 'RP',  nat: '🇮🇳' },
  { id: 17, name: 'Shubman Gill',    country: 'India',        role: 'Batter',      tier: 'Gold',     base: 65,  img: 'SG',  nat: '🇮🇳' },
  { id: 18, name: 'Shaheen Afridi',  country: 'Pakistan',     role: 'Bowler',      tier: 'Silver',   base: 60,  img: 'SA',  nat: '🇵🇰' },
  { id: 19, name: 'Trent Boult',     country: 'New Zealand',  role: 'Bowler',      tier: 'Silver',   base: 55,  img: 'TB',  nat: '🇳🇿' },
  { id: 20, name: 'Faf du Plessis',  country: 'South Africa', role: 'Batter',      tier: 'Silver',   base: 50,  img: 'FP',  nat: '🇿🇦' },
];

export const DEFAULT_TEAMS: Team[] = [
  { id: 'you', name: 'Your Team',    color: '#00DC72', photo: null },
  { id: 't1',  name: 'Thunder XI',   color: '#F59E0B', photo: null },
  { id: 't2',  name: 'Royal Giants', color: '#4F8EF7', photo: null },
  { id: 't3',  name: 'Super Kings',  color: '#EC4899', photo: null },
];

export const ROLE_COLORS: Record<string, string> = {
  'Batter':      '#4F8EF7',
  'Bowler':      '#EF4444',
  'All-rounder': '#F59E0B',
  'WK-Batter':   '#8B5CF6',
};

export const TIER_COLORS: Record<string, string> = {
  'Elite':    '#F59E0B',
  'Platinum': '#8B8FA8',
  'Gold':     '#EAB308',
  'Silver':   '#6B7280',
};
