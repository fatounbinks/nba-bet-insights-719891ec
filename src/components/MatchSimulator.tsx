import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { nbaApi, InteractiveMatchPrediction, PlayerFullPrediction } from "@/services/nbaApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Flame, AlertTriangle } from "lucide-react";
import { PlayerDetailsModal } from "./PlayerDetailsModal";

interface MatchSimulatorProps {
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
}

export function MatchSimulator({
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
}: MatchSimulatorProps) {
  const [homeAbsentIndices, setHomeAbsentIndices] = useState<number[]>([]);
  const [awayAbsentIndices, setAwayAbsentIndices] = useState<number[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerFullPrediction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTeam, setModalTeam] = useState<"home" | "away">("home");

  // Initial fetch without absent players
  const { data: initialPrediction, isLoading: initialLoading } = useQuery({
    queryKey: ["interactive-match-prediction-initial", homeTeamId, awayTeamId],
    queryFn: () =>
      nbaApi.getFullMatchPredictionWithAbsents(homeTeamId, awayTeamId),
  });

  // Build list of player IDs from current state and initial data
  const homeAbsentIds = useMemo(() => {
    return homeAbsentIndices
      .map((idx) => initialPrediction?.home_players[idx]?.player_id)
      .filter((id) => id !== undefined) as number[];
  }, [homeAbsentIndices, initialPrediction]);

  const awayAbsentIds = useMemo(() => {
    return awayAbsentIndices
      .map((idx) => initialPrediction?.away_players[idx]?.player_id)
      .filter((id) => id !== undefined) as number[];
  }, [awayAbsentIndices, initialPrediction]);

  // Fetch with absent players (triggers immediately when absent IDs change)
  const { data: prediction, isLoading: predictionLoading, isFetching: isPredictionFetching } = useQuery({
    queryKey: [
      "interactive-match-prediction",
      homeTeamId,
      awayTeamId,
      homeAbsentIds.length > 0 ? homeAbsentIds.join(",") : "none",
      awayAbsentIds.length > 0 ? awayAbsentIds.join(",") : "none",
    ],
    queryFn: () =>
      nbaApi.getFullMatchPredictionWithAbsents(
        homeTeamId,
        awayTeamId,
        homeAbsentIds.length > 0 ? homeAbsentIds : undefined,
        awayAbsentIds.length > 0 ? awayAbsentIds : undefined
      ),
    enabled: !initialLoading && initialPrediction !== undefined,
  });

  // Use the prediction with absent players if we have any, otherwise use initial
  const displayPrediction =
    (homeAbsentIds.length > 0 || awayAbsentIds.length > 0) && prediction
      ? prediction
      : initialPrediction;

  // Show loading indicator only during recalculation (not on initial load)
  const isRecalculating =
    isPredictionFetching &&
    (homeAbsentIds.length > 0 || awayAbsentIds.length > 0);

  const isLoading = initialLoading;

  const toggleHomePlayerAbsent = useCallback(
    (playerIndex: number) => {
      setHomeAbsentIndices((prev) =>
        prev.includes(playerIndex)
          ? prev.filter((idx) => idx !== playerIndex)
          : [...prev, playerIndex]
      );
    },
    []
  );

  const toggleAwayPlayerAbsent = useCallback(
    (playerIndex: number) => {
      setAwayAbsentIndices((prev) =>
        prev.includes(playerIndex)
          ? prev.filter((idx) => idx !== playerIndex)
          : [...prev, playerIndex]
      );
    },
    []
  );

  const hasHighBlowoutRisk = useMemo(() => {
    if (!displayPrediction) return false;
    const allPlayers = [...displayPrediction.home_players, ...displayPrediction.away_players];
    return allPlayers.some((p) => p.blowout_analysis.risk_level === "HIGH");
  }, [displayPrediction]);

  if (!displayPrediction) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Chargement des prédictions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context Banner */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-amber-500/10 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="text-lg font-bold text-foreground">{homeTeamName}</div>
              <div className="text-muted-foreground">vs</div>
              <div className="text-lg font-bold text-foreground">{awayTeamName}</div>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {displayPrediction.match_context.home_usage_boost > 0 && (
                <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 border gap-1">
                  <Flame className="h-3 w-3" />
                  <span className="text-xs">🔥 Redistribution attaque: +{displayPrediction.match_context.home_usage_boost.toFixed(1)}% ({homeTeamName})</span>
                </Badge>
              )}
              {displayPrediction.match_context.away_usage_boost > 0 && (
                <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 border gap-1">
                  <Flame className="h-3 w-3" />
                  <span className="text-xs">🔥 Redistribution attaque: +{displayPrediction.match_context.away_usage_boost.toFixed(1)}% ({awayTeamName})</span>
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blowout Alert */}
      {hasHighBlowoutRisk && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400 text-sm">
                ⚠️ Risque de Blowout élevé
              </p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                L'écart prévu pourrait être important. Les titulaires pourraient être mis au repos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State - Only show during recalculation */}
      {isRecalculating && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Recalcul de la redistribution en cours...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Two-Column Layout: Home & Away Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Home Team Players Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              {homeTeamName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">État</TableHead>
                    <TableHead className="max-w-[100px] text-ellipsis">Nom</TableHead>
                    <TableHead className="text-right text-xs">MIN</TableHead>
                    <TableHead className="text-right text-xs font-bold">PTS</TableHead>
                    <TableHead className="text-right text-xs">REB</TableHead>
                    <TableHead className="text-right text-xs">AST</TableHead>
                    <TableHead className="text-right text-xs bg-amber-500/10 font-bold">PRA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayPrediction.home_players.map((player, idx) => {
                    const isAbsent = homeAbsentIndices.includes(idx);
                    const boostValue = displayPrediction.match_context.home_usage_boost;

                    return (
                      <TableRow
                        key={`home-${idx}`}
                        className={isAbsent ? "bg-muted/50 opacity-60" : ""}
                      >
                        <TableCell className="w-10">
                          <Checkbox
                            checked={isAbsent}
                            onCheckedChange={() => toggleHomePlayerAbsent(idx)}
                            disabled={isLoading}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-xs truncate">
                          {player.player}
                          {player.position && <span className="text-xs text-muted-foreground ml-1">({player.position})</span>}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {player.predicted_stats.MIN.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="font-bold text-sm">
                              {player.predicted_stats.PTS.toFixed(1)}
                            </span>
                            {boostValue > 0 && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                +{boostValue.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {player.predicted_stats.REB.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {player.predicted_stats.AST.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right font-bold bg-amber-500/10 text-xs">
                          {player.advanced_metrics_projected.PRA.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Away Team Players Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              {awayTeamName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">État</TableHead>
                    <TableHead className="max-w-[100px] text-ellipsis">Nom</TableHead>
                    <TableHead className="text-right text-xs">MIN</TableHead>
                    <TableHead className="text-right text-xs font-bold">PTS</TableHead>
                    <TableHead className="text-right text-xs">REB</TableHead>
                    <TableHead className="text-right text-xs">AST</TableHead>
                    <TableHead className="text-right text-xs bg-amber-500/10 font-bold">PRA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayPrediction.away_players.map((player, idx) => {
                    const isAbsent = awayAbsentIndices.includes(idx);
                    const boostValue = displayPrediction.match_context.away_usage_boost;

                    return (
                      <TableRow
                        key={`away-${idx}`}
                        className={isAbsent ? "bg-muted/50 opacity-60" : ""}
                      >
                        <TableCell className="w-10">
                          <Checkbox
                            checked={isAbsent}
                            onCheckedChange={() => toggleAwayPlayerAbsent(idx)}
                            disabled={isLoading}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-xs truncate">
                          {player.player}
                          {player.position && <span className="text-xs text-muted-foreground ml-1">({player.position})</span>}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {player.predicted_stats.MIN.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="font-bold text-sm">
                              {player.predicted_stats.PTS.toFixed(1)}
                            </span>
                            {boostValue > 0 && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                +{boostValue.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {player.predicted_stats.REB.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {player.predicted_stats.AST.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right font-bold bg-amber-500/10 text-xs">
                          {player.advanced_metrics_projected.PRA.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
