import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerFullPrediction } from "@/services/nbaApi";
import { Zap, Target, Shield, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getReasoningStyle } from "@/lib/utils";

interface MatchDetailsTableProps {
  teamName: string;
  players: PlayerFullPrediction[];
  isHomeTeam?: boolean;
}

export function MatchDetailsTable({ teamName, players, isHomeTeam = false }: MatchDetailsTableProps) {
  const sortedPlayers = [...players].sort((a, b) => {
    const aPts = a.predicted_stats.PTS || 0;
    const bPts = b.predicted_stats.PTS || 0;
    return bPts - aPts;
  });

  const getPositionBadgeColor = (position?: string) => {
    if (!position) return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
    switch (position.toUpperCase()) {
      case "G":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "F":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "C":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-300";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
    }
  };

  const getMatchupIcon = (matchupAnalysis?: Record<string, any>) => {
    if (!matchupAnalysis) return null;
    
    const paintVulnerability = matchupAnalysis.paint_vulnerability;
    if (paintVulnerability && paintVulnerability > 1.1) {
      return (
        <div className="flex items-center gap-1" title="Cible Intérieure - Paint Vulnerability détectée">
          <Target className="h-4 w-4 text-green-500" />
          <span className="text-xs text-green-600 dark:text-green-400">Paint</span>
        </div>
      );
    }
    
    return null;
  };

  const borderColor = isHomeTeam ? "border-l-purple-500" : "border-l-amber-500";

  return (
    <TooltipProvider>
      <Card className={`border-l-4 ${borderColor}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{teamName}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {sortedPlayers.length} joueurs
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Joueur</th>
                <th className="text-right py-2 px-2 font-semibold text-muted-foreground">MIN</th>
                <th className="text-right py-2 px-2 font-semibold text-muted-foreground">
                  <span className="font-bold">PTS</span>
                </th>
                <th className="text-right py-2 px-2 font-semibold text-muted-foreground">REB</th>
                <th className="text-right py-2 px-2 font-semibold text-muted-foreground">AST</th>
                <th className="text-right py-2 px-2 font-semibold text-muted-foreground">3PM</th>
                <th className="text-right py-2 px-2 font-semibold text-primary">PRA</th>
                <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Analyse</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{player.player}</p>
                      </div>
                      {player.context?.reasoning && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="flex-shrink-0 p-1 hover:opacity-75 transition-opacity">
                              <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            className={`max-w-xs ${
                              getReasoningStyle(player.context.reasoning).backgroundColor
                            } ${
                              getReasoningStyle(player.context.reasoning).textColor
                            } border ${
                              getReasoningStyle(player.context.reasoning).borderColor
                            }`}
                          >
                            <p className="text-sm font-medium">{player.context.reasoning}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {player.position && (
                        <Badge className={`text-xs ${getPositionBadgeColor(player.position)}`}>
                          {player.position}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right text-foreground">
                    {player.predicted_stats.MIN.toFixed(1)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="font-bold text-lg text-foreground">
                      {player.predicted_stats.PTS.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right text-foreground">
                    {player.predicted_stats.REB.toFixed(1)}
                  </td>
                  <td className="py-3 px-2 text-right text-foreground">
                    {player.predicted_stats.AST.toFixed(1)}
                  </td>
                  <td className="py-3 px-2 text-right text-foreground">
                    {player.predicted_stats.FG3M.toFixed(1)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="font-bold text-primary text-base">
                      {player.advanced_metrics_projected.PRA.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {getMatchupIcon(player.matchup_analysis)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
