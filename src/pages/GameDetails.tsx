import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { nbaApi, TodayGame } from "@/services/nbaApi";
import { MatchDetailsTable } from "@/components/MatchDetailsTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, AlertTriangle, ArrowLeft } from "lucide-react";
import { getTeamCode } from "@/lib/teamMapping";

const GameDetails = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["48h-games"],
    queryFn: () => nbaApi.get48hGames(),
  });

  const currentGame = games?.find((g) => g.gameId === gameId);
  const homeTeamId = currentGame?.homeTeamId || (currentGame ? getTeamCode(currentGame.homeTeam) : "");
  const awayTeamId = currentGame?.awayTeamId || (currentGame ? getTeamCode(currentGame.awayTeam) : "");

  const {
    data: matchPrediction,
    isLoading: predictionLoading,
    error: predictionError,
  } = useQuery({
    queryKey: ["full-match-prediction", homeTeamId, awayTeamId],
    queryFn: () => nbaApi.getFullMatchPrediction(homeTeamId, awayTeamId),
    enabled: !!homeTeamId && !!awayTeamId && !gamesLoading,
  });

  const isLoading = gamesLoading || predictionLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-display font-bold text-gradient">NBA Betting Insights</h1>
            </div>
            <p className="text-muted-foreground">Advanced player statistics and trend analysis for sports betting</p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-muted-foreground mt-4 text-center">
              Analysing Matchups & Rotations...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-display font-bold text-gradient">NBA Betting Insights</h1>
            </div>
            <p className="text-muted-foreground">Advanced player statistics and trend analysis for sports betting</p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          <Card className="bg-destructive/10 border-destructive/50">
            <CardContent className="pt-6">
              <p className="text-destructive">Match not found.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const blowoutRiskLevel = matchPrediction?.blowout_analysis?.risk_level || "LOW";
  const hasHighBlowoutRisk = blowoutRiskLevel === "HIGH";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-display font-bold text-gradient">NBA Betting Insights</h1>
          </div>
          <p className="text-muted-foreground">Advanced player statistics and trend analysis for sports betting</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        {/* Match Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {currentGame.awayTeam} @ {currentGame.homeTeam}
              </h2>
              <p className="text-muted-foreground mt-1">{currentGame.gameDate} • {currentGame.time}</p>
            </div>
            {currentGame.isLive && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                <span className="text-sm font-bold text-red-600 dark:text-red-500">LIVE</span>
              </div>
            )}
          </div>

          {/* Blowout Warning */}
          {hasHighBlowoutRisk && (
            <Alert className="border-l-4 border-l-amber-500 bg-amber-500/10 mb-6">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-amber-900 dark:text-amber-200">
                ⚠️ Risque de Blowout élevé : Temps de jeu des stars potentiellement réduit.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Error State */}
        {predictionError && (
          <Alert className="border-l-4 border-l-destructive bg-destructive/10 mb-6">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              Erreur lors du chargement des données. Veuillez réessayer.
            </AlertDescription>
          </Alert>
        )}

        {/* Players Tables */}
        {matchPrediction && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MatchDetailsTable
              teamName={currentGame.awayTeam}
              players={matchPrediction.away_players}
              isHomeTeam={false}
            />
            <MatchDetailsTable
              teamName={currentGame.homeTeam}
              players={matchPrediction.home_players}
              isHomeTeam={true}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>NBA Betting Insights Dashboard • Data from NBA Stats API</p>
        </div>
      </footer>
    </div>
  );
};

export default GameDetails;
