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
  const [homeAbsentPlayers, setHomeAbsentPlayers] = useState<string[]>([]);
  const [awayAbsentPlayers, setAwayAbsentPlayers] = useState<string[]>([]);

  // Convert player names to IDs for API call (using player name as identifier)
  const homeAbsentIds = homeAbsentPlayers.map((name) => {
    const player = prediction?.home_players.find((p) => p.player === name);
    return player?.player_id || 0;
  }).filter((id) => id > 0);

  const awayAbsentIds = awayAbsentPlayers.map((name) => {
    const player = prediction?.away_players.find((p) => p.player === name);
    return player?.player_id || 0;
  }).filter((id) => id > 0);

  const { data: prediction, isLoading } = useQuery({
    queryKey: ["interactive-match-prediction", homeTeamId, awayTeamId, homeAbsentPlayers.join(","), awayAbsentPlayers.join(",")],
    queryFn: () =>
      nbaApi.getFullMatchPredictionWithAbsents(
        homeTeamId,
        awayTeamId,
        homeAbsentIds.length > 0 ? homeAbsentIds : undefined,
        awayAbsentIds.length > 0 ? awayAbsentIds : undefined
      ),
  });

  const toggleHomePlayerAbsent = useCallback(
    (playerName: string) => {
      setHomeAbsentPlayers((prev) =>
        prev.includes(playerName) ? prev.filter((name) => name !== playerName) : [...prev, playerName]
      );
    },
    []
  );

  const toggleAwayPlayerAbsent = useCallback(
    (playerName: string) => {
      setAwayAbsentPlayers((prev) =>
        prev.includes(playerName) ? prev.filter((name) => name !== playerName) : [...prev, playerName]
      );
    },
    []
  );

  const hasHighBlowoutRisk = useMemo(() => {
    if (!prediction) return false;
    const allPlayers = [...prediction.home_players, ...prediction.away_players];
    return allPlayers.some((p) => p.blowout_analysis.risk_level === "HIGH");
  }, [prediction]);

  if (!prediction) {
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
              {prediction.match_context.home_usage_boost > 0 && (
                <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 border gap-1">
                  <Flame className="h-3 w-3" />
                  <span className="text-xs">🔥 Redistribution attaque: +{prediction.match_context.home_usage_boost.toFixed(1)}% ({homeTeamName})</span>
                </Badge>
              )}
              {prediction.match_context.away_usage_boost > 0 && (
                <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 border gap-1">
                  <Flame className="h-3 w-3" />
                  <span className="text-xs">🔥 Redistribution attaque: +{prediction.match_context.away_usage_boost.toFixed(1)}% ({awayTeamName})</span>
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

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Recalcul de la redistribution en cours...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Home Team Players Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{homeTeamName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">État</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">MIN</TableHead>
                  <TableHead className="text-right font-bold">PTS</TableHead>
                  <TableHead className="text-right">REB</TableHead>
                  <TableHead className="text-right">AST</TableHead>
                  <TableHead className="text-right bg-amber-500/10 font-bold">PRA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prediction.home_players.map((player, idx) => {
                  const isAbsent = player.player_id ? homeAbsentIds.includes(player.player_id) : false;
                  const boostValue = prediction.match_context.home_usage_boost;
                  const boostApplied = player.context?.boost_applied || "";

                  return (
                    <TableRow
                      key={player.player_id || `home-${idx}`}
                      className={isAbsent ? "bg-muted/50 opacity-60" : ""}
                    >
                      <TableCell className="w-10">
                        {player.player_id && (
                          <Checkbox
                            checked={isAbsent}
                            onCheckedChange={() => toggleHomePlayerAbsent(player.player_id!)}
                            disabled={isLoading}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {player.player}
                        {player.position && <span className="text-xs text-muted-foreground ml-2">({player.position})</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {player.predicted_stats.MIN.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="font-bold text-base">
                            {player.predicted_stats.PTS.toFixed(1)}
                          </span>
                          {boostValue > 0 && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                              +{boostValue.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {player.predicted_stats.REB.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {player.predicted_stats.AST.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-bold bg-amber-500/10">
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
          <CardTitle className="text-lg">{awayTeamName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">État</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">MIN</TableHead>
                  <TableHead className="text-right font-bold">PTS</TableHead>
                  <TableHead className="text-right">REB</TableHead>
                  <TableHead className="text-right">AST</TableHead>
                  <TableHead className="text-right bg-amber-500/10 font-bold">PRA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prediction.away_players.map((player, idx) => {
                  const isAbsent = player.player_id ? awayAbsentIds.includes(player.player_id) : false;
                  const boostValue = prediction.match_context.away_usage_boost;
                  const boostApplied = player.context?.boost_applied || "";

                  return (
                    <TableRow
                      key={player.player_id || `away-${idx}`}
                      className={isAbsent ? "bg-muted/50 opacity-60" : ""}
                    >
                      <TableCell className="w-10">
                        {player.player_id && (
                          <Checkbox
                            checked={isAbsent}
                            onCheckedChange={() => toggleAwayPlayerAbsent(player.player_id!)}
                            disabled={isLoading}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {player.player}
                        {player.position && <span className="text-xs text-muted-foreground ml-2">({player.position})</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {player.predicted_stats.MIN.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="font-bold text-base">
                            {player.predicted_stats.PTS.toFixed(1)}
                          </span>
                          {boostValue > 0 && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                              +{boostValue.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {player.predicted_stats.REB.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {player.predicted_stats.AST.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-bold bg-amber-500/10">
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
  );
}
