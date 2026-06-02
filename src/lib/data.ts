import { Player, Team } from './types';

export const TEAM_COLOR_PALETTE = [
  '#00DC72',
  '#F59E0B',
  '#4F8EF7',
  '#EC4899',
  '#8B5CF6',
  '#EF4444',
  '#14B8A6',
  '#F97316',
];

const IPL_PLAYERS: Player[] = [
  { id: 1, name: 'Virat Kohli', country: 'India', role: 'Batter', tier: 'Elite', base: 200, img: 'VK', nat: '🇮🇳' },
  { id: 2, name: 'Jasprit Bumrah', country: 'India', role: 'Bowler', tier: 'Elite', base: 200, img: 'JB', nat: '🇮🇳' },
  { id: 3, name: 'MS Dhoni', country: 'India', role: 'WK-Batter', tier: 'Elite', base: 150, img: 'MSD', nat: '🇮🇳' },
  { id: 4, name: 'Rohit Sharma', country: 'India', role: 'Batter', tier: 'Elite', base: 180, img: 'RS', nat: '🇮🇳' },
  { id: 5, name: 'Pat Cummins', country: 'Australia', role: 'Bowler', tier: 'Platinum', base: 140, img: 'PC', nat: '🇦🇺' },
  { id: 6, name: 'Rashid Khan', country: 'Afghanistan', role: 'Bowler', tier: 'Platinum', base: 120, img: 'RK', nat: '🇦🇫' },
  { id: 7, name: 'Andre Russell', country: 'West Indies', role: 'All-rounder', tier: 'Platinum', base: 130, img: 'AR', nat: '🇼🇮' },
  { id: 8, name: 'KL Rahul', country: 'India', role: 'WK-Batter', tier: 'Platinum', base: 110, img: 'KL', nat: '🇮🇳' },
  { id: 9, name: 'Ravindra Jadeja', country: 'India', role: 'All-rounder', tier: 'Platinum', base: 100, img: 'RJ', nat: '🇮🇳' },
  { id: 10, name: 'Jos Buttler', country: 'England', role: 'WK-Batter', tier: 'Platinum', base: 120, img: 'JBu', nat: '🇬🇧' },
  { id: 11, name: 'Hardik Pandya', country: 'India', role: 'All-rounder', tier: 'Gold', base: 90, img: 'HP', nat: '🇮🇳' },
  { id: 12, name: 'Sunil Narine', country: 'West Indies', role: 'All-rounder', tier: 'Gold', base: 80, img: 'SN', nat: '🇼🇮' },
];

const FOOTBALL_PLAYERS: Player[] = [
  { id: 101, name: 'Lionel Messi', country: 'Argentina', role: 'Forward', tier: 'Elite', base: 220, img: 'LM', nat: '🇦🇷' },
  { id: 102, name: 'Kylian Mbappe', country: 'France', role: 'Forward', tier: 'Elite', base: 210, img: 'KM', nat: '🇫🇷' },
  { id: 103, name: 'Kevin De Bruyne', country: 'Belgium', role: 'Midfielder', tier: 'Elite', base: 185, img: 'KDB', nat: '🇧🇪' },
  { id: 104, name: 'Jude Bellingham', country: 'England', role: 'Midfielder', tier: 'Platinum', base: 175, img: 'JB', nat: '🇬🇧' },
  { id: 105, name: 'Erling Haaland', country: 'Norway', role: 'Forward', tier: 'Elite', base: 215, img: 'EH', nat: '🇳🇴' },
  { id: 106, name: 'Virgil van Dijk', country: 'Netherlands', role: 'Defender', tier: 'Platinum', base: 150, img: 'VVD', nat: '🇳🇱' },
  { id: 107, name: 'Rodri', country: 'Spain', role: 'Midfielder', tier: 'Platinum', base: 160, img: 'ROD', nat: '🇪🇸' },
  { id: 108, name: 'Alisson Becker', country: 'Brazil', role: 'Goalkeeper', tier: 'Gold', base: 135, img: 'AB', nat: '🇧🇷' },
  { id: 109, name: 'Bukayo Saka', country: 'England', role: 'Forward', tier: 'Gold', base: 140, img: 'BS', nat: '🇬🇧' },
  { id: 110, name: 'Luka Modric', country: 'Croatia', role: 'Midfielder', tier: 'Gold', base: 115, img: 'LMO', nat: '🇭🇷' },
  { id: 111, name: 'Achraf Hakimi', country: 'Morocco', role: 'Defender', tier: 'Gold', base: 120, img: 'AH', nat: '🇲🇦' },
  { id: 112, name: 'Mike Maignan', country: 'France', role: 'Goalkeeper', tier: 'Silver', base: 95, img: 'MM', nat: '🇫🇷' },
];

const BASKETBALL_PLAYERS: Player[] = [
  { id: 201, name: 'LeBron James', country: 'USA', role: 'Forward', tier: 'Elite', base: 220, img: 'LJ', nat: '🇺🇸' },
  { id: 202, name: 'Stephen Curry', country: 'USA', role: 'Guard', tier: 'Elite', base: 210, img: 'SC', nat: '🇺🇸' },
  { id: 203, name: 'Nikola Jokic', country: 'Serbia', role: 'Center', tier: 'Elite', base: 205, img: 'NJ', nat: '🇷🇸' },
  { id: 204, name: 'Giannis Antetokounmpo', country: 'Greece', role: 'Forward', tier: 'Elite', base: 215, img: 'GA', nat: '🇬🇷' },
  { id: 205, name: 'Luka Doncic', country: 'Slovenia', role: 'Guard', tier: 'Platinum', base: 195, img: 'LD', nat: '🇸🇮' },
  { id: 206, name: 'Jayson Tatum', country: 'USA', role: 'Forward', tier: 'Platinum', base: 180, img: 'JT', nat: '🇺🇸' },
  { id: 207, name: 'Joel Embiid', country: 'Cameroon', role: 'Center', tier: 'Platinum', base: 175, img: 'JE', nat: '🇨🇲' },
  { id: 208, name: 'Shai Gilgeous-Alexander', country: 'Canada', role: 'Guard', tier: 'Gold', base: 165, img: 'SGA', nat: '🇨🇦' },
  { id: 209, name: 'Anthony Edwards', country: 'USA', role: 'Guard', tier: 'Gold', base: 150, img: 'AE', nat: '🇺🇸' },
  { id: 210, name: 'Victor Wembanyama', country: 'France', role: 'Center', tier: 'Gold', base: 155, img: 'VW', nat: '🇫🇷' },
  { id: 211, name: 'Damian Lillard', country: 'USA', role: 'Guard', tier: 'Silver', base: 125, img: 'DL', nat: '🇺🇸' },
  { id: 212, name: 'Bam Adebayo', country: 'USA', role: 'Center', tier: 'Silver', base: 115, img: 'BA', nat: '🇺🇸' },
];

export const DEFAULT_PLAYERS: Player[] = IPL_PLAYERS.map((player) => ({ ...player }));
export const DEFAULT_TEAMS: Team[] = buildDefaultTeams(4, 'Your Team', null);

function clonePlayers(players: Player[]) {
  return players.map((player) => ({ ...player }));
}

export function getPlayersForSport(sport: string) {
  const normalized = sport.toLowerCase();

  if (normalized.includes('fifa') || normalized.includes('uefa') || normalized.includes('football')) {
    return clonePlayers(FOOTBALL_PLAYERS);
  }

  if (normalized.includes('nba') || normalized.includes('basketball')) {
    return clonePlayers(BASKETBALL_PLAYERS);
  }

  return clonePlayers(IPL_PLAYERS);
}

export function buildDefaultTeams(
  participants: number,
  hostTeamName = 'Your Team',
  hostTeamPhoto: string | null = null
) {
  return Array.from({ length: participants }, (_, index) => ({
    id: index === 0 ? 'you' : `t${index}`,
    name: index === 0 ? hostTeamName : `Team ${index + 1}`,
    color: TEAM_COLOR_PALETTE[index % TEAM_COLOR_PALETTE.length],
    photo: index === 0 ? hostTeamPhoto : null,
  }));
}

export const ROLE_COLORS: Record<string, string> = {
  Batter: '#4F8EF7',
  Bowler: '#EF4444',
  'All-rounder': '#F59E0B',
  'WK-Batter': '#8B5CF6',
  Forward: '#00DC72',
  Midfielder: '#4F8EF7',
  Defender: '#F59E0B',
  Goalkeeper: '#8B5CF6',
  Guard: '#00DC72',
  Center: '#EF4444',
};

export const TIER_COLORS: Record<string, string> = {
  Elite: '#F59E0B',
  Platinum: '#8B8FA8',
  Gold: '#EAB308',
  Silver: '#6B7280',
};
