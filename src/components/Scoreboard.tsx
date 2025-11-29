import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { nbaApi } from "@/services/nbaApi";
import { Calendar } from "lucide-react";

export function Scoreboard() {
  const { data: games, isLoading } = useQuery({
    queryKey: ["today-games"],
    queryFn: () => nbaApi.getTodayGames(),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className="card-gradient border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            Today's Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">Loading games...</p>
        </CardContent>
      </Card>
    );
  }

  if (!games || games.length === 0) {
    return (
      <Card className="card-gradient border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            Today's Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">No games scheduled today</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-gradient border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          Today's Games
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <div
              key={game.game_id}
              className="bg-secondary/50 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-foreground">{game.away_team}</span>
                  {game.away_score !== undefined && (
                    <span className="text-2xl font-bold text-primary">{game.away_score}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground text-center">@</div>
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-foreground">{game.home_team}</span>
                  {game.home_score !== undefined && (
                    <span className="text-2xl font-bold text-primary">{game.home_score}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground text-center mt-2">
                  {game.status === "Final" ? "Final" : game.game_time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
