const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export interface Player {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  team?: string;
}

export interface SeasonStats {
  PLAYER_ID: number;
  GP: number;
  MIN: number;
  PTS: number;
  AST: number;
  REB: number;
  STL: number;
  BLK: number;
  FG3M: number;
  PRA: number;
  PA: number;
  PR: number;
  AR: number;
}

export interface GameLog {
  GAME_DATE: string;
  MATCHUP: string;
  WL: string;
  PTS: number;
  REB: number;
  AST: number;
  PRA: number;
  PA: number;
  PR: number;
}

export interface TrendResult {
  current_active_streak: number;
  total_hits: number;
  hit_rate_percent: number;
  message: string;
}

export interface TodayGame {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  gameDate: string;
  isLive: boolean;
}

export interface VsTeamStats {
  GP: number;
  PTS: number;
  AST: number;
  REB: number;
  PRA: number;
  PA: number;
  PR: number;
  AR: number;
  STL: number;
  BLK: number;
  OPPONENT?: string;
}

export interface MatchPrediction {
  home_team: string;
  away_team: string;
  predicted_winner: string;
  predicted_margin: number;
  confidence_level: string;
  win_probability_home: number;
  predicted_total_points: number;
  details: {
    home_net_rtg: number;
    away_net_rtg: number;
    spread_raw: number;
  };
}

export interface PlayerProjection {
  player_id: number;
  player_name: string;
  opponent_team: string;
  projected_pts: number;
  projected_reb: number;
  projected_ast: number;
  season_avg_pts: number;
  season_avg_reb: number;
  season_avg_ast: number;
  pace: number;
  opponent_defense_rating: number;
}

export const nbaApi = {
  // CORRECTION ICI : passage à 30h pour correspondre au backend
  async get48hGames(): Promise<TodayGame[]> {
    const response = await fetch(`${API_BASE_URL}/games/30h`);
    if (!response.ok) throw new Error("Failed to fetch games");
    return response.json();
  },

  async searchPlayers(query: string): Promise<Player[]> {
    const response = await fetch(`${API_BASE_URL}/players/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Failed to search players");
    return response.json();
  },

  async getPlayerSeason(playerId: number): Promise<SeasonStats> {
    const response = await fetch(`${API_BASE_URL}/player/${playerId}/season`);
    if (!response.ok) throw new Error("Failed to fetch player season stats");
    return response.json();
  },

  async getPlayerRecent(playerId: number, limit: number = 10): Promise<GameLog[]> {
    const response = await fetch(`${API_BASE_URL}/player/${playerId}/recent?limit=${limit}`);
    if (!response.ok) throw new Error("Failed to fetch recent games");
    return response.json();
  },

  async getPlayerVsTeam(playerId: number, teamCode: string): Promise<VsTeamStats> {
    const response = await fetch(`${API_BASE_URL}/player/${playerId}/vs/${teamCode}`);
    if (!response.ok) throw new Error("Failed to fetch vs team stats");
    return response.json();
  },

  async analyzeTrend(playerId: number, stat: string, threshold: number): Promise<TrendResult> {
    const response = await fetch(
      `${API_BASE_URL}/player/${playerId}/trend?stat=${stat}&threshold=${threshold}`
    );
    if (!response.ok) throw new Error("Failed to analyze trend");
    return response.json();
  },

  async predictMatch(
    homeTeamId: string,
    awayTeamId: string,
    homeStarMissing?: boolean,
    awayStarMissing?: boolean
  ): Promise<MatchPrediction> {
    const params = new URLSearchParams();
    if (homeStarMissing) params.append("home_star_missing", "true");
    if (awayStarMissing) params.append("away_star_missing", "true");
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`${API_BASE_URL}/predict/match/${homeTeamId}/${awayTeamId}${queryString}`);
    if (!response.ok) throw new Error("Failed to predict match");
    return response.json();
  },

  async predictPlayerStats(
    playerId: number,
    opponentTeamId: string
  ): Promise<PlayerProjection> {
    const response = await fetch(`${API_BASE_URL}/predict/player/${playerId}/vs/${opponentTeamId}`);
    if (!response.ok) throw new Error("Failed to predict player stats");
    return response.json();
  },
};
