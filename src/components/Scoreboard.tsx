import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { nbaApi, TodayGame } from "@/services/nbaApi";
import { Calendar, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MatchPredictionModal } from "./MatchPredictionModal";

export function Scoreboard() {
  const [selectedGame, setSelectedGame] = useState<TodayGame | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: games, isLoading } = useQuery({
    queryKey: ["48h-games"],
    queryFn: () => nbaApi.get48hGames(),
    refetchInterval: 60000,
  });

  const handleAnalyzeClick = (game: TodayGame) => {
    setSelectedGame(game);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="card-gradient border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            Matchs NBA
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
            Matchs NBA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">No games scheduled</p>
        </CardContent>
      </Card>
    );
  }

  const gamesByDate = games.reduce((acc, game) => {
    if (!acc[game.gameDate]) {
      acc[game.gameDate] = [];
    }
    acc[game.gameDate].push(game);
    return acc;
  }, {} as Record<string, typeof games>);

  return (
    <Card className="card-gradient border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          Matchs NBA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(gamesByDate).map(([date, dateGames]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {date}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dateGames.map((game) => (
                <div
                  key={game.gameId}
                  className="bg-secondary/50 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors relative flex flex-col"
                >
                  {game.isLive && (
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                      </span>
                      <span className="text-xs font-bold text-red-500">LIVE</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-semibold text-foreground text-sm flex-1 min-w-0 truncate" title={game.awayTeam}>
                        {game.awayTeam}
                      </span>
                      {game.awayScore !== undefined && (
                        <span className="text-2xl font-bold text-primary flex-shrink-0">{game.awayScore}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground text-center">@</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-semibold text-foreground text-sm flex-1 min-w-0 truncate" title={game.homeTeam}>
                        {game.homeTeam}
                      </span>
                      {game.homeScore !== undefined && (
                        <span className="text-2xl font-bold text-primary flex-shrink-0">{game.homeScore}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground text-center mt-2 font-medium">
                      {game.status}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-8 gap-1.5 hover:bg-purple-500/20 hover:border-purple-500/50"
                      onClick={() => handleAnalyzeClick(game)}
                    >
                      <Brain className="h-3.5 w-3.5" />
                      Analyser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>

      <MatchPredictionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        game={selectedGame}
      />
    </Card>
  );
}
