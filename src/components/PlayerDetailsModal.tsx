import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { nbaApi, PlayerFullPrediction } from "@/services/nbaApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp, Flame } from "lucide-react";

interface PlayerDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  player: PlayerFullPrediction;
  opponentTeamName: string;
  opponentTeamId: string;
}

type StatCategory = "PTS" | "REB" | "AST" | "PRA";

const STAT_DISPLAY_NAMES: Record<StatCategory, string> = {
  PTS: "Points",
  REB: "Rebounds",
  AST: "Assists",
  PRA: "PTS+REB+AST",
};

const getProjectionValue = (
  player: PlayerFullPrediction,
  stat: StatCategory
): number => {
  if (stat === "PRA") return player.advanced_metrics_projected.PRA;
  return player.predicted_stats[stat] || 0;
};

export function PlayerDetailsModal({
  isOpen,
  onOpenChange,
  player,
  opponentTeamName,
  opponentTeamId,
}: PlayerDetailsModalProps) {
  const [selectedStat, setSelectedStat] = useState<StatCategory>("PTS");
  const [bookmakerLine, setBookmakerLine] = useState("");
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const projection = getProjectionValue(player, selectedStat);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["player-details-history", player.player_id, opponentTeamId],
    queryFn: () =>
      nbaApi.getPlayerDetailsHistory(player.player_id, opponentTeamId),
    enabled: isOpen,
  });

  const { data: calculatorResult, refetch: analyzeCalculator } = useQuery({
    queryKey: [
      "calculator-analysis",
      player.player_id,
      projection,
      bookmakerLine,
      selectedStat,
    ],
    queryFn: () =>
      nbaApi.getCalculatorAnalysis(
        projection,
        parseFloat(bookmakerLine),
        selectedStat
      ),
    enabled: false,
  });

  const handleAnalyze = () => {
    if (bookmakerLine && parseFloat(bookmakerLine) > 0) {
      analyzeCalculator();
      setCalculatorOpen(true);
    }
  };

  const handleStatChange = (value: string) => {
    setSelectedStat(value as StatCategory);
    setCalculatorOpen(false);
  };

  const recentForm = useMemo(() => {
    return historyData?.recent_form || [];
  }, [historyData]);

  const h2hHistory = useMemo(() => {
    return historyData?.h2h_history || [];
  }, [historyData]);

  const getRecommendationColor = (recommendation: string): string => {
    const upper = recommendation.toUpperCase();
    if (upper.includes("OVER")) return "bg-emerald-500/20 border-emerald-500/30 text-emerald-600";
    if (upper.includes("UNDER")) return "bg-red-500/20 border-red-500/30 text-red-600";
    return "bg-amber-500/20 border-amber-500/30 text-amber-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="border-b pb-4">
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold">
              {player.player}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Matchup:</span>
              <Badge variant="outline" className="text-sm">
                vs {opponentTeamName}
              </Badge>
              {player.position && (
                <Badge variant="secondary" className="text-sm">
                  {player.position}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Projection Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {player.predicted_stats.MIN.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">MIN</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {player.predicted_stats.PTS.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PTS</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {player.advanced_metrics_projected.PRA.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PRA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Tabs */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              <TrendingUp className="inline-block h-4 w-4 mr-2" />
              HISTORIQUE
            </h3>
            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recent">Forme Récente (10 matchs)</TabsTrigger>
                <TabsTrigger value="h2h">Face-à-Face (H2H)</TabsTrigger>
              </TabsList>

              {/* Recent Form Tab */}
              <TabsContent value="recent" className="space-y-4">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : recentForm.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table className="text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">MIN</TableHead>
                          <TableHead className="text-right">PTS</TableHead>
                          <TableHead className="text-right">REB</TableHead>
                          <TableHead className="text-right">AST</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentForm.map((game, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/50">
                            <TableCell className="font-medium text-xs">
                              {new Date(game.date).toLocaleDateString("fr-FR", {
                                month: "2-digit",
                                day: "2-digit",
                              })}
                            </TableCell>
                            <TableCell className="text-right">{game.min}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {game.pts}
                            </TableCell>
                            <TableCell className="text-right">{game.reb}</TableCell>
                            <TableCell className="text-right">{game.ast}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </TabsContent>

              {/* H2H Tab */}
              <TabsContent value="h2h" className="space-y-4">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : h2hHistory.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table className="text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">MIN</TableHead>
                          <TableHead className="text-right">PTS</TableHead>
                          <TableHead className="text-right">REB</TableHead>
                          <TableHead className="text-right">AST</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {h2hHistory.map((game, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/50">
                            <TableCell className="font-medium text-xs">
                              {new Date(game.date).toLocaleDateString("fr-FR", {
                                month: "2-digit",
                                day: "2-digit",
                              })}
                            </TableCell>
                            <TableCell className="text-right">{game.min}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {game.pts}
                            </TableCell>
                            <TableCell className="text-right">{game.reb}</TableCell>
                            <TableCell className="text-right">{game.ast}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Betting Calculator */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              EST-CE QUE ÇA PASSE ?
            </h3>

            <div className="space-y-4">
              {/* Stat Selector and Line Input */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Stat
                  </label>
                  <Select value={selectedStat} onValueChange={handleStatChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PTS">Points (PTS)</SelectItem>
                      <SelectItem value="REB">Rebounds (REB)</SelectItem>
                      <SelectItem value="AST">Assists (AST)</SelectItem>
                      <SelectItem value="PRA">PTS+REB+AST (PRA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Ligne du Bookmaker
                  </label>
                  <Input
                    type="number"
                    placeholder="Ex: 22.5"
                    value={bookmakerLine}
                    onChange={(e) => setBookmakerLine(e.target.value)}
                    step="0.5"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Projection Display */}
              <div className="bg-secondary/30 rounded-lg p-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Notre Algo
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {projection.toFixed(1)}
                    </p>
                  </div>
                  {bookmakerLine && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">
                        Écart
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          parseFloat(bookmakerLine) > 0
                            ? projection > parseFloat(bookmakerLine)
                              ? "text-emerald-600"
                              : "text-red-600"
                            : ""
                        }`}
                      >
                        {parseFloat(bookmakerLine) > 0
                          ? (projection - parseFloat(bookmakerLine)).toFixed(1)
                          : "-"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={!bookmakerLine || parseFloat(bookmakerLine) <= 0}
                className="w-full h-10"
                size="lg"
              >
                Analyser
              </Button>

              {/* Calculator Results */}
              {calculatorOpen && calculatorResult && (
                <div className="space-y-4 mt-4 pt-4 border-t">
                  <Card className={getRecommendationColor(calculatorResult.recommendation)}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Probability Bar */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-muted-foreground">
                              PROBABILITÉ
                            </p>
                            <p className="text-lg font-bold">
                              {(calculatorResult.probability * 100).toFixed(0)}%
                            </p>
                          </div>
                          <Progress
                            value={calculatorResult.probability * 100}
                            className="h-2"
                          />
                        </div>

                        {/* Recommendation */}
                        <div className="text-center py-2">
                          <p className="text-lg font-bold uppercase">
                            {calculatorResult.recommendation}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Confiance: {calculatorResult.confidence}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
