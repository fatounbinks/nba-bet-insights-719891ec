import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { nbaApi, Player } from "@/services/nbaApi";
import { TrendingUp, Activity, Target } from "lucide-react";
import { useState } from "react";

interface PlayerDashboardProps {
  player: Player;
}

export function PlayerDashboard({ player }: PlayerDashboardProps) {
  const [vsTeamInput, setVsTeamInput] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [trendStat, setTrendStat] = useState("PTS");
  const [trendThreshold, setTrendThreshold] = useState("");

  const { data: seasonStats, isLoading: seasonLoading } = useQuery({
    queryKey: ["player-season", player.id],
    queryFn: () => nbaApi.getPlayerSeason(player.id),
  });

  const { data: recentGames, isLoading: recentLoading } = useQuery({
    queryKey: ["player-recent", player.id],
    queryFn: () => nbaApi.getPlayerRecent(player.id),
  });

  const { data: vsTeamStats, isLoading: vsTeamLoading } = useQuery({
    queryKey: ["player-vs-team", player.id, selectedTeam],
    queryFn: () => nbaApi.getPlayerVsTeam(player.id, selectedTeam!),
    enabled: !!selectedTeam,
  });

  const { data: trendResult, refetch: analyzeTrend, isFetching: trendLoading } = useQuery({
    queryKey: ["player-trend", player.id, trendStat, trendThreshold],
    queryFn: () => nbaApi.analyzeTrend(player.id, trendStat, parseFloat(trendThreshold)),
    enabled: false,
  });

  const handleVsTeamSearch = () => {
    if (vsTeamInput.trim()) {
      setSelectedTeam(vsTeamInput.trim().toUpperCase());
    }
  };

  const handleTrendAnalysis = () => {
    if (trendThreshold) {
      analyzeTrend();
    }
  };

  return (
    <div className="space-y-6">
      {/* Player Summary Card */}
      <Card className="card-gradient border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-foreground">
            <TrendingUp className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-3xl font-display font-bold">{player.full_name}</h2>
              {player.team && <p className="text-sm text-muted-foreground mt-1">{player.team}</p>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {seasonLoading ? (
            <p className="text-muted-foreground text-center">Loading season stats...</p>
          ) : seasonStats ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-4xl font-display font-bold text-primary">{seasonStats.PTS.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground mt-1">PTS</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-display font-bold text-nba-blue">{seasonStats.REB.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground mt-1">REB</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-display font-bold text-accent">{seasonStats.AST.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground mt-1">AST</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-display font-bold text-foreground">{seasonStats.FG3M.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground mt-1">3PM</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-display font-bold text-foreground">{seasonStats.MIN.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground mt-1">MIN</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">Matchs Récents</TabsTrigger>
          <TabsTrigger value="vs">Vs Adversaire</TabsTrigger>
          <TabsTrigger value="trend">Analyseur de Streak</TabsTrigger>
        </TabsList>

        {/* Tab 1: Recent Games */}
        <TabsContent value="recent">
          <Card className="card-gradient border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Activity className="h-5 w-5 text-primary" />
                5 Derniers Matchs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <p className="text-muted-foreground text-center">Loading recent games...</p>
              ) : recentGames && recentGames.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Matchup</TableHead>
                      <TableHead>W/L</TableHead>
                      <TableHead>PTS</TableHead>
                      <TableHead>REB</TableHead>
                      <TableHead>AST</TableHead>
                      <TableHead>MIN</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentGames.slice(0, 5).map((game, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{game.GAME_DATE}</TableCell>
                        <TableCell>{game.MATCHUP}</TableCell>
                        <TableCell>
                          <span className={game.WL === "W" ? "text-win-green" : "text-loss-red"}>
                            {game.WL}
                          </span>
                        </TableCell>
                        <TableCell className="text-primary font-bold">{game.PTS}</TableCell>
                        <TableCell>{game.REB}</TableCell>
                        <TableCell>{game.AST}</TableCell>
                        <TableCell>{game.MIN}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center">No recent games found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Vs Team */}
        <TabsContent value="vs">
          <Card className="card-gradient border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Target className="h-5 w-5 text-primary" />
                Stats Contre une Équipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Input
                  type="text"
                  placeholder="Ex: LAL, GSW, BOS..."
                  value={vsTeamInput}
                  onChange={(e) => setVsTeamInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleVsTeamSearch()}
                  className="flex-1"
                />
                <Button onClick={handleVsTeamSearch}>Rechercher</Button>
              </div>

              {vsTeamLoading ? (
                <p className="text-muted-foreground text-center">Loading stats...</p>
              ) : vsTeamStats ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-secondary/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">{vsTeamStats.games_played}</p>
                    <p className="text-sm text-muted-foreground mt-1">Games Played</p>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">{vsTeamStats.avg_pts.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Avg PTS</p>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-nba-blue">{vsTeamStats.avg_reb.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Avg REB</p>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-accent">{vsTeamStats.avg_ast.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Avg AST</p>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-win-green">{vsTeamStats.total_wins}</p>
                    <p className="text-sm text-muted-foreground mt-1">Wins</p>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-loss-red">{vsTeamStats.total_losses}</p>
                    <p className="text-sm text-muted-foreground mt-1">Losses</p>
                  </div>
                </div>
              ) : selectedTeam ? (
                <p className="text-muted-foreground text-center">No data found for {selectedTeam}</p>
              ) : (
                <p className="text-muted-foreground text-center">Enter a team abbreviation to search</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Trend Analysis */}
        <TabsContent value="trend">
          <Card className="card-gradient border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-5 w-5 text-primary" />
                Analyseur de Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Stat</label>
                    <Select value={trendStat} onValueChange={setTrendStat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PTS">Points</SelectItem>
                        <SelectItem value="REB">Rebounds</SelectItem>
                        <SelectItem value="AST">Assists</SelectItem>
                        <SelectItem value="PRA">PTS+REB+AST</SelectItem>
                        <SelectItem value="PA">PTS+AST</SelectItem>
                        <SelectItem value="PR">PTS+REB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Seuil</label>
                    <Input
                      type="number"
                      placeholder="Ex: 25.5"
                      value={trendThreshold}
                      onChange={(e) => setTrendThreshold(e.target.value)}
                      step="0.5"
                    />
                  </div>
                </div>
                <Button onClick={handleTrendAnalysis} disabled={!trendThreshold || trendLoading} className="w-full">
                  {trendLoading ? "Analyse en cours..." : "Analyser"}
                </Button>
              </div>

              {trendResult && (
                <div className="bg-primary/10 border border-primary/20 p-6 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">{trendResult.current_active_streak}</p>
                      <p className="text-sm text-muted-foreground mt-1">Current Streak</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-accent">{trendResult.total_hits}</p>
                      <p className="text-sm text-muted-foreground mt-1">Total Hits</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-nba-blue">{trendResult.hit_rate_percent.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground mt-1">Hit Rate</p>
                    </div>
                  </div>
                  <p className="text-foreground text-center">{trendResult.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
