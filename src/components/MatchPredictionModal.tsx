import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { nbaApi, MatchPrediction, TodayGame } from "@/services/nbaApi";
import { Zap, Brain } from "lucide-react";
import { getTeamCode } from "@/lib/teamMapping";

interface MatchPredictionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: TodayGame | null;
}

export function MatchPredictionModal({ open, onOpenChange, game }: MatchPredictionModalProps) {
  const [homeStarMissing, setHomeStarMissing] = useState(false);
  const [awayStarMissing, setAwayStarMissing] = useState(false);

  // Build team IDs from game data using team code mapping
  const homeTeamId = game ? getTeamCode(game.homeTeam) : "";
  const awayTeamId = game ? getTeamCode(game.awayTeam) : "";

  const { data: prediction, isLoading, refetch } = useQuery({
    queryKey: ["match-prediction", homeTeamId, awayTeamId, homeStarMissing, awayStarMissing],
    queryFn: () => nbaApi.predictMatch(homeTeamId, awayTeamId, homeStarMissing, awayStarMissing),
    enabled: open && !!homeTeamId && !!awayTeamId,
  });

  // Get confidence level styling
  const getConfidenceBadgeColor = (confidence: string) => {
    const lower = confidence.toLowerCase();
    if (lower.includes("tight") || lower.includes("serré")) return "bg-amber-500/20 border-amber-500/50 text-amber-700";
    if (lower.includes("solid") || lower.includes("solide")) return "bg-emerald-500/20 border-emerald-500/50 text-emerald-700";
    if (lower.includes("blowout")) return "bg-red-500/20 border-red-500/50 text-red-700";
    return "bg-primary/20 border-primary/50";
  };

  // Get winner badge color (purple/gold for AI distinction)
  const getWinnerColor = (winner: string) => {
    if (winner === game?.homeTeam) {
      return "text-purple-600 dark:text-purple-400";
    }
    return "text-amber-600 dark:text-amber-400";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <Zap className="h-5 w-5 text-amber-500" />
            Analyse IA - Pronostic du Match
          </DialogTitle>
          <DialogDescription>
            {game && `${game.awayTeam} @ ${game.homeTeam}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400"></div>
          </div>
        ) : prediction ? (
          <div className="space-y-6">
            {/* Winner Prediction */}
            <Card className="bg-gradient-to-br from-purple-600/10 to-amber-500/10 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-lg">Pronostic du Vainqueur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className={`text-4xl font-display font-bold ${getWinnerColor(prediction.predicted_winner)}`}>
                    {prediction.predicted_winner}
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={prediction.win_probability_home} className="flex-1 h-3" />
                    <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                      {prediction.win_probability_home.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spread & Confidence */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="text-base">Écart Prévu (Spread)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-display font-bold text-amber-600 dark:text-amber-400">
                    {prediction.predicted_winner === game?.homeTeam ? "+" : "-"}{Math.abs(prediction.details.spread_raw).toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{prediction.predicted_winner}</p>
                </CardContent>
              </Card>

              <Card className="border-purple-500/30 bg-purple-500/5">
                <CardHeader>
                  <CardTitle className="text-base">Confiance</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-24">
                  <Badge className={getConfidenceBadgeColor(prediction.confidence_level)}>
                    {prediction.confidence_level}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Key Factors */}
            <Card className="border-indigo-500/30 bg-indigo-500/5">
              <CardHeader>
                <CardTitle className="text-lg">Facteurs Clés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-muted-foreground">Net Rating - Équipes</div>
                    <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{game?.homeTeam}</p>
                        <p className="text-2xl font-display font-bold text-purple-600 dark:text-purple-400">
                          {prediction.details.home_net_rtg.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{game?.awayTeam}</p>
                        <p className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400">
                          {prediction.details.away_net_rtg.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-muted-foreground">Marge Prédite</div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-2xl font-display font-bold text-indigo-600 dark:text-indigo-400">
                        {Math.abs(prediction.predicted_margin).toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Points d'écart</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Star Missing Checkboxes */}
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardHeader>
                <CardTitle className="text-base">Options d'Analyse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => setHomeStarMissing(!homeStarMissing)}>
                  <Checkbox checked={homeStarMissing} onCheckedChange={setHomeStarMissing} />
                  <label className="flex-1 text-sm font-medium cursor-pointer">
                    Star {game?.homeTeam} Absente
                  </label>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => setAwayStarMissing(!awayStarMissing)}>
                  <Checkbox checked={awayStarMissing} onCheckedChange={setAwayStarMissing} />
                  <label className="flex-1 text-sm font-medium cursor-pointer">
                    Star {game?.awayTeam} Absente
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Total Points */}
            <Card className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-500/30">
              <CardHeader>
                <CardTitle className="text-base">Score Total Prévu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-display font-bold text-teal-600 dark:text-teal-400">
                  {prediction.predicted_total_points.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Points combinés des deux équipes</p>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={() => refetch()} variant="outline" className="flex-1">
                Actualiser l'Analyse
              </Button>
              <Button onClick={() => onOpenChange(false)} className="flex-1">
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Impossible de charger le pronostic. Veuillez réessayer.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
