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

export interface AbsencesImpact {
  home_penalty: number;
  away_penalty: number;
}

export interface ContextAnalysis {
  home_fatigue_factors: string[];
  away_fatigue_factors: string[];
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
  context_analysis?: ContextAnalysis;
  absences_impact?: AbsencesImpact;
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

export interface PlayerStats {
  games: number;
  win_percentage: number;
  ppg: number;
  status: string;
}

export interface MissingPlayerAnalysis {
  player_id: number;
  player_name: string;
  team: string;
  stats_with: PlayerStats;
  stats_without: PlayerStats;
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

  async getTeamRoster(teamId: string): Promise<Player[]> {
    const response = await fetch(`${API_BASE_URL}/team/${teamId}/roster`);
    if (!response.ok) throw new Error("Failed to fetch team roster");
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
    homeMissingPlayerIds?: number[],
    awayMissingPlayerIds?: number[]
  ): Promise<MatchPrediction> {
    const params = new URLSearchParams();
    if (homeMissingPlayerIds && homeMissingPlayerIds.length > 0) {
      homeMissingPlayerIds.forEach(id => params.append("home_missing_players", id.toString()));
    }
    if (awayMissingPlayerIds && awayMissingPlayerIds.length > 0) {
      awayMissingPlayerIds.forEach(id => params.append("away_missing_players", id.toString()));
    }
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

  async analyzeMissingPlayer(
    teamCode: string,
    playerId: number
  ): Promise<MissingPlayerAnalysis> {
    const response = await fetch(`${API_BASE_URL}/analytics/team/${teamCode}/missing-player/${playerId}`);
    if (!response.ok) throw new Error("Failed to analyze missing player impact");
    return response.json();
  },
};
